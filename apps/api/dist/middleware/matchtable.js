import { prisma } from "../lib/prisma.js";
export const validateMatchId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid match id",
        });
    }
    next();
};
export const validateTournamentId = async (req, res, next) => {
    const { tournament_id } = req.body;
    if (tournament_id === undefined || tournament_id === null || tournament_id === "") {
        return res.status(400).json({
            message: "tournament_id is required",
        });
    }
    if (!Number.isInteger(tournament_id)) {
        return res.status(400).json({
            message: "tournament_id must be an integer",
        });
    }
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournament_id },
    });
    if (!tournament) {
        return res.status(404).json({
            message: "Tournament not found",
        });
    }
    next();
};
export const validatePlayer1 = async (req, res, next) => {
    const { tournament_id, player1_id } = req.body;
    if (player1_id === undefined || player1_id === null || player1_id === "") {
        return res.status(400).json({
            message: "player1_id is required",
        });
    }
    if (!Number.isInteger(player1_id)) {
        return res.status(400).json({
            message: "player1_id must be an integer",
        });
    }
    const member = await prisma.tournamentMember.findFirst({
        where: {
            tournament_id,
            user_id: player1_id,
        },
    });
    if (!member) {
        return res.status(400).json({
            message: "player1_id must belong to this tournament",
        });
    }
    next();
};
export const validatePlayer2 = async (req, res, next) => {
    const { tournament_id, player2_id } = req.body;
    if (player2_id === undefined || player2_id === null || player2_id === "") {
        return res.status(400).json({
            message: "player2_id is required",
        });
    }
    if (!Number.isInteger(player2_id)) {
        return res.status(400).json({
            message: "player2_id must be an integer",
        });
    }
    const member = await prisma.tournamentMember.findFirst({
        where: {
            tournament_id,
            user_id: player2_id,
        },
    });
    if (!member) {
        return res.status(400).json({
            message: "player2_id must belong to this tournament",
        });
    }
    next();
};
export const validateDifferentPlayers = (req, res, next) => {
    const { player1_id, player2_id } = req.body;
    if (player1_id === player2_id) {
        return res.status(400).json({
            message: "player1_id and player2_id cannot be the same",
        });
    }
    next();
};
export const validateWinner = (req, res, next) => {
    const { winner_id, player1_id, player2_id } = req.body;
    if (winner_id === undefined) {
        return res.status(400).json({
            message: "winner_id is required",
        });
    }
    if (winner_id !== null && !Number.isInteger(winner_id)) {
        return res.status(400).json({
            message: "winner_id must be an integer or null",
        });
    }
    if (winner_id !== null &&
        winner_id !== player1_id &&
        winner_id !== player2_id) {
        return res.status(400).json({
            message: "winner_id must be either player1_id, player2_id, or null",
        });
    }
    next();
};
export const validateRoundNumber = (req, res, next) => {
    const { round_number } = req.body;
    if (round_number === undefined || round_number === null || round_number === "") {
        return res.status(400).json({
            message: "round_number is required",
        });
    }
    if (!Number.isInteger(round_number) || round_number <= 0) {
        return res.status(400).json({
            message: "round_number must be a positive integer",
        });
    }
    next();
};
export const validateMatchOrder = (req, res, next) => {
    const { match_order } = req.body;
    if (match_order === undefined || match_order === null || match_order === "") {
        return res.status(400).json({
            message: "match_order is required",
        });
    }
    if (!Number.isInteger(match_order) || match_order <= 0) {
        return res.status(400).json({
            message: "match_order must be a positive integer",
        });
    }
    next();
};
export const validateMatchStatus = (req, res, next) => {
    const { match_status } = req.body;
    if (match_status === undefined || match_status === null || match_status === "") {
        return res.status(400).json({
            message: "match_status is required",
        });
    }
    if (typeof match_status !== "string") {
        return res.status(400).json({
            message: "match_status must be a string",
        });
    }
    if (match_status !== "pending" && match_status !== "completed") {
        return res.status(400).json({
            message: 'match_status must be either "pending" or "completed"',
        });
    }
    next();
};
