import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  validateTournamentName,
  validateTournamentDescription,
  validateTournamentStatus,
  validateBracketSize,
  validateTournamentId,
} from "../middleware/tournamenttable.js";
import { generateBracketMatches } from "../utils/bracketGenerator.js";
import { broadcastTournamentUpdate } from "../websocket.js";
import { sendTournamentUpdateEmails } from "../emailService.js";
import {
  tournamentsCreatedTotal,
  tournamentsUpdatedTotal,
  tournamentsDeletedTotal,
} from "../metrics.js";

const router = Router();

// CREATE tournament
router.post(
  "/",
  requireAuth,
  validateTournamentName,
  validateTournamentDescription,
  validateTournamentStatus,
  validateBracketSize,
  async (req, res) => {
    try {
      const { name, description, bracket_size, status } = req.body;

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const tournament = await prisma.tournament.create({
        data: {
          name,
          description,
          created_by: req.user.id,
          bracket_size,
          status,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      tournamentsCreatedTotal.inc();
      return res.status(201).json(tournament);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// READ all tournaments
router.get("/", async (_req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { created_at: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            matches: true,
          },
        },
      },
    });

    return res.json(tournaments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// READ my tournaments
router.get("/my-tournaments", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tournaments = await prisma.tournament.findMany({
      where: {
        OR: [
          { created_by: req.user.id },
          { members: { some: { user_id: req.user.id } } }
        ]
      },
      orderBy: { created_at: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            matches: true,
          },
        },
      },
    });

    return res.json(tournaments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// READ tournament by id
router.get("/:id", validateTournamentId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    let tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        matches: true,
      },
    });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (tournament.members.length === 6 && tournament.matches.length === 0) {
      try {
        await generateBracketMatches(id);
        tournament = await prisma.tournament.findUnique({
          where: { id },
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
            matches: true,
          },
        });
      } catch (error) {
        console.error("Failed to auto-generate bracket matches:", error);
      }
    }

    return res.json(tournament);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// UPDATE tournament
router.patch("/:id", requireAuth, validateTournamentId, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, bracket_size, status } = req.body;

    if (
      name === undefined &&
      description === undefined &&
      bracket_size === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        message: "Provide at least one field to update",
      });
    }

    const existingTournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existingTournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!req.user || req.user.id !== existingTournament.created_by) {
      return res.status(403).json({
        message: "Only the creator can update this tournament",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({ message: "Tournament name must be a string" });
      }

      if (name.trim().length === 0) {
        return res.status(400).json({ message: "Tournament name cannot be empty" });
      }
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res
          .status(400)
          .json({ message: "Tournament description must be a string" });
      }

      if (description.trim().length === 0) {
        return res
          .status(400)
          .json({ message: "Tournament description cannot be empty" });
      }
    }

    if (bracket_size !== undefined) {
      if (!Number.isInteger(bracket_size) || bracket_size <= 0) {
        return res
          .status(400)
          .json({ message: "bracket_size must be a positive integer" });
      }
    }

    if (status !== undefined) {
      if (typeof status !== "string") {
        return res.status(400).json({ message: "Status must be a string" });
      }

      if (status !== "active" && status !== "inactive") {
        return res
          .status(400)
          .json({ message: 'Status must be either "active" or "inactive"' });
      }
    }

    // Diff fields that actually changed
    const changes: Record<string, { from: string | number; to: string | number }> = {};

    if (name !== undefined && name.trim() !== existingTournament.name) {
      changes.name = { from: existingTournament.name, to: name.trim() };
    }
    if (
      description !== undefined &&
      description.trim() !== (existingTournament.description ?? "")
    ) {
      changes.description = {
        from: existingTournament.description ?? "(none)",
        to: description.trim(),
      };
    }
    if (bracket_size !== undefined && bracket_size !== existingTournament.bracket_size) {
      changes.bracket_size = { from: existingTournament.bracket_size, to: bracket_size };
    }
    if (status !== undefined && status !== existingTournament.status) {
      changes.status = { from: existingTournament.status, to: status };
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(bracket_size !== undefined && { bracket_size }),
        ...(status !== undefined && { status }),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    tournamentsUpdatedTotal.inc();

    broadcastTournamentUpdate(updatedTournament);

    // Send email notifications to tournament members (non-blocking)
    if (Object.keys(changes).length > 0) {
      prisma.tournamentMember
        .findMany({
          where: { tournament_id: id },
          include: {
            user: { select: { email: true, username: true } },
          },
        })
        .then((members: Array<{ user: { email: string; username: string } }>) => {
          const recipients = members.map((m: { user: { email: string; username: string } }) => ({
            email: m.user.email,
            username: m.user.username,
          }));
          return sendTournamentUpdateEmails({
            tournamentId: id,
            tournamentName: updatedTournament.name,
            updatedByUsername: updatedTournament.creator.username,
            changes,
            recipients,
          });
        })
        .catch((err: unknown) => {
          console.error("[Email] Failed to dispatch tournament update emails:", err);
        });
    }

    return res.json(updatedTournament);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE tournament
router.delete("/:id", requireAuth, validateTournamentId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingTournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existingTournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (!req.user || req.user.id !== existingTournament.created_by) {
      return res.status(403).json({
        message: "Only the creator can delete this tournament",
      });
    }

    await prisma.$transaction([
      prisma.match.deleteMany({
        where: { tournament_id: id },
      }),
      prisma.tournamentMember.deleteMany({
        where: { tournament_id: id },
      }),
      prisma.tournament.delete({
        where: { id },
      }),
    ]);

    tournamentsDeletedTotal.inc();
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;