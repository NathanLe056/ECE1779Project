import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  validateTournamentMemberId,
  validateTournamentId,
  validateUserId,
  validateRole,
  validateRanking,
  validateUniqueTournamentMember,
  validateTournamentCapacity,
} from "../middleware/tournamentmembertable.js";

const router = Router();

// CREATE tournament member
router.post(
  "/",
  validateTournamentId,
  validateUserId,
  validateRole,
  validateRanking,
  validateUniqueTournamentMember,
  validateTournamentCapacity,
  async (req, res) => {
    try {
      const { tournament_id, user_id, role, ranking } = req.body;

      const member = await prisma.tournamentMember.create({
        data: {
          tournament_id,
          user_id,
          role,
          ranking,
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json(member);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET all tournament members
router.get("/", async (_req, res) => {
  try {
    const members = await prisma.tournamentMember.findMany({
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return res.json(members);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET tournament member by id
router.get("/:id", validateTournamentMemberId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const member = await prisma.tournamentMember.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ message: "Tournament member not found" });
    }

    return res.json(member);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// UPDATE tournament member
router.patch("/:id", validateTournamentMemberId, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { role, ranking } = req.body;

    if (role === undefined && ranking === undefined) {
      return res.status(400).json({
        message: "Provide at least one field to update",
      });
    }

    if (role !== undefined) {
      if (typeof role !== "string") {
        return res.status(400).json({
          message: "role must be a string",
        });
      }

      if (role !== "admin" && role !== "player") {
        return res.status(400).json({
          message: 'role must be either "admin" or "player"',
        });
      }
    }

    if (ranking !== undefined) {
      if (!Number.isInteger(ranking)) {
        return res.status(400).json({
          message: "ranking must be an integer",
        });
      }
    }

    const updatedMember = await prisma.tournamentMember.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(ranking !== undefined && { ranking }),
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.json(updatedMember);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Tournament member not found" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE tournament member
router.delete("/:id", validateTournamentMemberId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.tournamentMember.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Tournament member not found" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;