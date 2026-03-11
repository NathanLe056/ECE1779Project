import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  validateMatchId,
  validateTournamentId,
  validatePlayer1,
  validatePlayer2,
  validateDifferentPlayers,
  validateWinner,
  validateRoundNumber,
  validateMatchOrder,
  validateMatchStatus,
} from "../middleware/matchtable.js";

const router = Router();

// CREATE match
router.post(
  "/",
  validateTournamentId,
  validatePlayer1,
  validatePlayer2,
  validateDifferentPlayers,
  validateWinner,
  validateRoundNumber,
  validateMatchOrder,
  validateMatchStatus,
  async (req, res) => {
    try {
      const {
        tournament_id,
        player1_id,
        player2_id,
        winner_id,
        round_number,
        match_order,
        match_status,
      } = req.body;

      const match = await prisma.match.create({
        data: {
          tournament_id,
          player1_id,
          player2_id,
          winner_id,
          round_number,
          match_order,
          match_status,
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return res.status(201).json(match);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET all matches
router.get("/", async (_req, res) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: [
        { tournament_id: "asc" },
        { round_number: "asc" },
        { match_order: "asc" },
      ],
    });

    return res.json(matches);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET match by id
router.get("/:id", validateMatchId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const match = await prisma.match.findUnique({
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
      },
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    return res.json(match);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// UPDATE match
router.patch("/:id", validateMatchId, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      player1_id,
      player2_id,
      winner_id,
      round_number,
      match_order,
      match_status,
    } = req.body;

    if (
      player1_id === undefined &&
      player2_id === undefined &&
      winner_id === undefined &&
      round_number === undefined &&
      match_order === undefined &&
      match_status === undefined
    ) {
      return res.status(400).json({
        message: "Provide at least one field to update",
      });
    }

    const existingMatch = await prisma.match.findUnique({
      where: { id },
    });

    if (!existingMatch) {
      return res.status(404).json({ message: "Match not found" });
    }

    const finalPlayer1Id =
      player1_id !== undefined ? player1_id : existingMatch.player1_id;
    const finalPlayer2Id =
      player2_id !== undefined ? player2_id : existingMatch.player2_id;
    const finalWinnerId =
      winner_id !== undefined ? winner_id : existingMatch.winner_id;
    const finalRoundNumber =
      round_number !== undefined ? round_number : existingMatch.round_number;
    const finalMatchOrder =
      match_order !== undefined ? match_order : existingMatch.match_order;
    const finalMatchStatus =
      match_status !== undefined ? match_status : existingMatch.match_status;

    if (!Number.isInteger(finalPlayer1Id)) {
      return res.status(400).json({ message: "player1_id must be an integer" });
    }

    if (!Number.isInteger(finalPlayer2Id)) {
      return res.status(400).json({ message: "player2_id must be an integer" });
    }

    if (finalPlayer1Id === finalPlayer2Id) {
      return res.status(400).json({
        message: "player1_id and player2_id cannot be the same",
      });
    }

    const player1Member = await prisma.tournamentMember.findFirst({
      where: {
        tournament_id: existingMatch.tournament_id,
        user_id: finalPlayer1Id,
      },
    });

    if (!player1Member) {
      return res.status(400).json({
        message: "player1_id must belong to this tournament",
      });
    }

    const player2Member = await prisma.tournamentMember.findFirst({
      where: {
        tournament_id: existingMatch.tournament_id,
        user_id: finalPlayer2Id,
      },
    });

    if (!player2Member) {
      return res.status(400).json({
        message: "player2_id must belong to this tournament",
      });
    }

    if (finalWinnerId !== null && finalWinnerId !== undefined) {
      if (!Number.isInteger(finalWinnerId)) {
        return res.status(400).json({
          message: "winner_id must be an integer or null",
        });
      }

      if (finalWinnerId !== finalPlayer1Id && finalWinnerId !== finalPlayer2Id) {
        return res.status(400).json({
          message: "winner_id must be either player1_id, player2_id, or null",
        });
      }
    }

    if (!Number.isInteger(finalRoundNumber) || finalRoundNumber <= 0) {
      return res.status(400).json({
        message: "round_number must be a positive integer",
      });
    }

    if (!Number.isInteger(finalMatchOrder) || finalMatchOrder <= 0) {
      return res.status(400).json({
        message: "match_order must be a positive integer",
      });
    }

    if (typeof finalMatchStatus !== "string") {
      return res.status(400).json({
        message: "match_status must be a string",
      });
    }

    if (finalMatchStatus !== "pending" && finalMatchStatus !== "completed") {
      return res.status(400).json({
        message: 'match_status must be either "pending" or "completed"',
      });
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        ...(player1_id !== undefined && { player1_id }),
        ...(player2_id !== undefined && { player2_id }),
        ...(winner_id !== undefined && { winner_id }),
        ...(round_number !== undefined && { round_number }),
        ...(match_order !== undefined && { match_order }),
        ...(match_status !== undefined && { match_status }),
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return res.json(updatedMatch);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE match
router.delete("/:id", validateMatchId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.match.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Match not found" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;