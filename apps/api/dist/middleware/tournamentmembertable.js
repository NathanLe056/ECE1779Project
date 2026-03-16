import { prisma } from "../lib/prisma.js";
export const validateTournamentMemberId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid member id",
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
export const validateUserId = async (req, res, next) => {
    const { user_id } = req.body;
    if (user_id === undefined || user_id === null || user_id === "") {
        return res.status(400).json({
            message: "user_id is required",
        });
    }
    if (!Number.isInteger(user_id)) {
        return res.status(400).json({
            message: "user_id must be an integer",
        });
    }
    const user = await prisma.user.findUnique({
        where: { id: user_id },
    });
    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }
    next();
};
export const validateRole = (req, res, next) => {
    const { role } = req.body;
    if (role === undefined || role === null || role === "") {
        return res.status(400).json({
            message: "role is required",
        });
    }
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
    next();
};
export const validateRanking = (req, res, next) => {
    const { ranking } = req.body;
    if (ranking === undefined || ranking === null || ranking === "") {
        return res.status(400).json({
            message: "ranking is required",
        });
    }
    if (!Number.isInteger(ranking)) {
        return res.status(400).json({
            message: "ranking must be an integer",
        });
    }
    next();
};
export const validateUniqueTournamentMember = async (req, res, next) => {
    const { tournament_id, user_id } = req.body;
    const existingMembership = await prisma.tournamentMember.findFirst({
        where: {
            tournament_id,
            user_id,
        },
    });
    if (existingMembership) {
        return res.status(409).json({
            message: "User already joined this tournament",
        });
    }
    next();
};
export const validateTournamentCapacity = async (req, res, next) => {
    const { tournament_id } = req.body;
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournament_id },
        select: {
            id: true,
            bracket_size: true,
        },
    });
    if (!tournament) {
        return res.status(404).json({
            message: "Tournament not found",
        });
    }
    const memberCount = await prisma.tournamentMember.count({
        where: { tournament_id },
    });
    if (memberCount >= tournament.bracket_size) {
        return res.status(400).json({
            message: "Tournament is full",
        });
    }
    next();
};
