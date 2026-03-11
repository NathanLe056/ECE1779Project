import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  validateTournamentName,
  validateTournamentDescription,
  validateCreatedBy,
  validateTournamentStatus,
  validateBracketSize,
  validateTournamentId,
} from "../middleware/tournamenttable.js";

const router = Router();

// CREATE tournament
router.post(
  "/",
  validateTournamentName,
  validateTournamentDescription,
  validateCreatedBy,
  validateTournamentStatus,
  validateBracketSize,
  async (req, res) => {
    try {
      const { name, description, created_by, bracket_size, status } = req.body;

      const tournament = await prisma.tournament.create({
        data: {
          name,
          description,
          created_by,
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

// READ tournament by id
router.get("/:id", validateTournamentId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const tournament = await prisma.tournament.findUnique({
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

    return res.json(tournament);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// UPDATE tournament
router.patch("/:id", validateTournamentId, async (req, res) => {
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

    return res.json(updatedTournament);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Tournament not found" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE tournament
router.delete("/:id", validateTournamentId, async (req, res) => {
  try {
    const id = Number(req.params.id);

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

    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Tournament not found" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;