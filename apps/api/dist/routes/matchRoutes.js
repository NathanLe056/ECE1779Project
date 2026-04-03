import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { generateBracketMatches } from "../utils/bracketGenerator.js";
const router = Router();
const ALLOWED_MATCH_STATUSES = [
    "not started",
    "pending",
    "completed",
    "cancelled",
    "bypass",
];
function getRoundOrderKey(roundNumber, matchOrder) {
    return `${roundNumber}-${matchOrder}`;
}
async function ensureLaterRoundMatches(tournament_id) {
    const existingMatches = await prisma.match.findMany({
        where: { tournament_id },
        orderBy: [{ round_number: "asc" }, { match_order: "asc" }],
    });
    const matchByRoundAndOrder = new Map(existingMatches.map((match) => [getRoundOrderKey(match.round_number, match.match_order), match]));
    const members = await prisma.tournamentMember.findMany({
        where: { tournament_id },
        orderBy: { id: "asc" },
    });
    const seed1 = members[0]?.user_id ?? -1;
    const seed2 = members[1]?.user_id ?? -1;
    const requiredMatches = [
        {
            round_number: 2,
            match_order: 1,
            player1_id: seed1,
            player2_id: -1,
        },
        {
            round_number: 2,
            match_order: 2,
            player1_id: seed2,
            player2_id: -1,
        },
        {
            round_number: 3,
            match_order: 1,
            player1_id: -1,
            player2_id: -1,
        },
    ];
    for (const requiredMatch of requiredMatches) {
        const key = getRoundOrderKey(requiredMatch.round_number, requiredMatch.match_order);
        if (matchByRoundAndOrder.has(key)) {
            continue;
        }
        await prisma.match.create({
            data: {
                tournament_id,
                player1_id: requiredMatch.player1_id,
                player2_id: requiredMatch.player2_id,
                winner_id: null,
                round_number: requiredMatch.round_number,
                match_order: requiredMatch.match_order,
                match_status: "pending",
            },
        });
    }
    return prisma.match.findMany({
        where: { tournament_id },
        orderBy: [{ round_number: "asc" }, { match_order: "asc" }],
    });
}
function getNextMatchSlot(currentMatch, matchByRoundAndOrder) {
    // QF1 winner -> SF2 player2, QF2 winner -> SF1 player2
    if (currentMatch.round_number === 1 && currentMatch.match_order === 1) {
        const nextMatch = matchByRoundAndOrder.get(getRoundOrderKey(2, 2));
        if (!nextMatch)
            return null;
        return { nextMatch, slot: "player2_id" };
    }
    if (currentMatch.round_number === 1 && currentMatch.match_order === 2) {
        const nextMatch = matchByRoundAndOrder.get(getRoundOrderKey(2, 1));
        if (!nextMatch)
            return null;
        return { nextMatch, slot: "player2_id" };
    }
    if (currentMatch.round_number === 2 && [1, 2].includes(currentMatch.match_order)) {
        const finalMatch = matchByRoundAndOrder.get(getRoundOrderKey(3, 1));
        if (!finalMatch)
            return null;
        return {
            nextMatch: finalMatch,
            slot: currentMatch.match_order === 1 ? "player1_id" : "player2_id",
        };
    }
    return null;
}
function propagateWinnerChanges(matches, startMatchId) {
    const matchById = new Map(matches.map((match) => [match.id, match]));
    const matchByRoundAndOrder = new Map(matches.map((match) => [getRoundOrderKey(match.round_number, match.match_order), match]));
    const updates = new Map();
    const queue = [startMatchId];
    const queued = new Set(queue);
    while (queue.length > 0) {
        const currentMatchId = queue.shift();
        queued.delete(currentMatchId);
        const currentMatch = matchById.get(currentMatchId);
        if (!currentMatch)
            continue;
        const nextMatchResult = getNextMatchSlot(currentMatch, matchByRoundAndOrder);
        if (!nextMatchResult)
            continue;
        const { nextMatch, slot } = nextMatchResult;
        const propagatedPlayerId = currentMatch.winner_id ?? -1;
        const participantChanged = nextMatch[slot] !== propagatedPlayerId;
        if (participantChanged) {
            nextMatch[slot] = propagatedPlayerId;
            const existingUpdate = updates.get(nextMatch.id) ?? {};
            updates.set(nextMatch.id, { ...existingUpdate, [slot]: propagatedPlayerId });
        }
        const winnerInvalid = nextMatch.winner_id !== null &&
            nextMatch.winner_id !== nextMatch.player1_id &&
            nextMatch.winner_id !== nextMatch.player2_id;
        if (participantChanged || winnerInvalid) {
            const shouldResetWinner = nextMatch.winner_id !== null;
            const shouldResetStatus = ["completed", "bypass"].includes(nextMatch.match_status);
            if (shouldResetWinner || shouldResetStatus) {
                nextMatch.winner_id = null;
                if (shouldResetStatus) {
                    nextMatch.match_status = "pending";
                }
                const existingUpdate = updates.get(nextMatch.id) ?? {};
                updates.set(nextMatch.id, {
                    ...existingUpdate,
                    ...(shouldResetWinner ? { winner_id: null } : {}),
                    ...(shouldResetStatus ? { match_status: "pending" } : {}),
                });
            }
            if (!queued.has(nextMatch.id)) {
                queue.push(nextMatch.id);
                queued.add(nextMatch.id);
            }
        }
    }
    return Array.from(updates.entries()).map(([id, data]) => ({ id, data }));
}
// Generate bracket matches for a tournament with 6 members
router.post("/generate-bracket/:tournament_id", requireAuth, async (req, res) => {
    try {
        const tournament_id = Number(req.params.tournament_id);
        if (!Number.isInteger(tournament_id) || tournament_id <= 0) {
            return res.status(400).json({ message: "Invalid tournament id" });
        }
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournament_id },
        });
        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found" });
        }
        if (!req.user || req.user.id !== tournament.created_by) {
            return res.status(403).json({
                message: "Only the tournament creator can generate bracket",
            });
        }
        const result = await generateBracketMatches(tournament_id);
        return res.status(201).json(result);
    }
    catch (error) {
        console.error("Error generating bracket:", error);
        return res.status(400).json({
            message: error.message || "Failed to generate bracket",
        });
    }
});
// GET all matches for a tournament
router.get("/tournament/:tournament_id", async (req, res) => {
    try {
        const tournament_id = Number(req.params.tournament_id);
        if (!Number.isInteger(tournament_id) || tournament_id <= 0) {
            return res.status(400).json({ message: "Invalid tournament id" });
        }
        let matches = await prisma.match.findMany({
            where: { tournament_id },
            orderBy: [{ round_number: "asc" }, { match_order: "asc" }],
        });
        // Ensure DB rows exist so frontend saves always target persisted matches.
        if (matches.length === 0) {
            try {
                await generateBracketMatches(tournament_id);
                matches = await prisma.match.findMany({
                    where: { tournament_id },
                    orderBy: [{ round_number: "asc" }, { match_order: "asc" }],
                });
            }
            catch (error) {
                console.error("Auto-generate matches skipped:", error);
            }
        }
        matches = await ensureLaterRoundMatches(tournament_id);
        return res.json(matches);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});
// GET match by id
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid match id" });
        }
        const match = await prisma.match.findUnique({ where: { id } });
        if (!match) {
            return res.status(404).json({ message: "Match not found" });
        }
        return res.json(match);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});
// UPDATE match and propagate winners to next round when completed
router.patch("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { winner_id, match_status, player1_id, player2_id } = req.body;
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid match id" });
        }
        if (winner_id === undefined &&
            match_status === undefined &&
            player1_id === undefined &&
            player2_id === undefined) {
            return res.status(400).json({
                message: "Provide at least one field to update",
            });
        }
        const existingMatch = await prisma.match.findUnique({
            where: { id },
            include: { tournament: true },
        });
        if (!existingMatch) {
            return res.status(404).json({ message: "Match not found" });
        }
        if (!req.user || req.user.id !== existingMatch.tournament.created_by) {
            return res.status(403).json({
                message: "Only the tournament creator can update matches",
            });
        }
        if (winner_id !== undefined && winner_id !== null && !Number.isInteger(winner_id)) {
            return res.status(400).json({
                message: "winner_id must be an integer or null",
            });
        }
        if (match_status !== undefined) {
            if (typeof match_status !== "string") {
                return res.status(400).json({
                    message: "match_status must be a string",
                });
            }
            if (!ALLOWED_MATCH_STATUSES.includes(match_status)) {
                return res.status(400).json({
                    message: 'match_status must be one of: "pending", "completed", "cancelled", "not started", "bypass"',
                });
            }
        }
        if (player1_id !== undefined && !Number.isInteger(player1_id)) {
            return res.status(400).json({ message: "player1_id must be an integer" });
        }
        if (player2_id !== undefined && !Number.isInteger(player2_id)) {
            return res.status(400).json({ message: "player2_id must be an integer" });
        }
        const nextPlayer1Id = player1_id ?? existingMatch.player1_id;
        const nextPlayer2Id = player2_id ?? existingMatch.player2_id;
        const nextMatchStatus = match_status ?? existingMatch.match_status;
        const nextWinnerId = winner_id !== undefined ? winner_id : existingMatch.winner_id;
        if (nextWinnerId !== null &&
            nextWinnerId !== nextPlayer1Id &&
            nextWinnerId !== nextPlayer2Id) {
            return res.status(400).json({
                message: "winner_id must match player1_id or player2_id",
            });
        }
        if (nextWinnerId !== null && nextMatchStatus !== "completed") {
            return res.status(400).json({
                message: "winner_id can only be set when match_status is completed",
            });
        }
        await ensureLaterRoundMatches(existingMatch.tournament_id);
        const { updatedMatch, refreshedMatches } = await prisma.$transaction(async (tx) => {
            const transactionUpdatedMatch = await tx.match.update({
                where: { id },
                data: {
                    ...(winner_id !== undefined && { winner_id: winner_id === null ? null : winner_id }),
                    ...(match_status !== undefined && { match_status }),
                    ...(player1_id !== undefined && { player1_id }),
                    ...(player2_id !== undefined && { player2_id }),
                },
            });
            const allMatches = (await tx.match.findMany({
                where: { tournament_id: transactionUpdatedMatch.tournament_id },
                orderBy: [{ round_number: "asc" }, { match_order: "asc" }],
            }));
            const propagatedUpdates = propagateWinnerChanges(allMatches, transactionUpdatedMatch.id);
            for (const update of propagatedUpdates) {
                await tx.match.update({
                    where: { id: update.id },
                    data: update.data,
                });
            }
            const transactionRefreshedMatches = await tx.match.findMany({
                where: { tournament_id: transactionUpdatedMatch.tournament_id },
                orderBy: [{ round_number: "asc" }, { match_order: "asc" }],
            });
            return {
                updatedMatch: transactionUpdatedMatch,
                refreshedMatches: transactionRefreshedMatches,
            };
        });
        return res.json({
            message: "Match updated successfully",
            match: updatedMatch,
            matches: refreshedMatches,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});
// DELETE match
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid match id" });
        }
        const existingMatch = await prisma.match.findUnique({
            where: { id },
            include: { tournament: true },
        });
        if (!existingMatch) {
            return res.status(404).json({ message: "Match not found" });
        }
        if (!req.user || req.user.id !== existingMatch.tournament.created_by) {
            return res.status(403).json({
                message: "Only the tournament creator can delete matches",
            });
        }
        await prisma.match.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});
export default router;
