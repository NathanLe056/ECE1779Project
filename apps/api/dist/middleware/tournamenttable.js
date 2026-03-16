import { prisma } from "../lib/prisma.js";
export const validateTournamentName = (req, res, next) => {
    const { name } = req.body;
    if (name === undefined || name === null || name === "") {
        return res.status(400).json({
            message: "Tournament name is required",
        });
    }
    if (typeof name !== "string") {
        return res.status(400).json({
            message: "Tournament name must be a string",
        });
    }
    if (name.trim().length === 0) {
        return res.status(400).json({
            message: "Tournament name cannot be empty",
        });
    }
    req.body.name = name.trim();
    next();
};
export const validateTournamentDescription = (req, res, next) => {
    const { description } = req.body;
    if (description === undefined || description === null || description === "") {
        return res.status(400).json({
            message: "Tournament description is required",
        });
    }
    if (typeof description !== "string") {
        return res.status(400).json({
            message: "Tournament description must be a string",
        });
    }
    if (description.trim().length === 0) {
        return res.status(400).json({
            message: "Tournament description cannot be empty",
        });
    }
    req.body.description = description.trim();
    next();
};
export const validateCreatedBy = async (req, res, next) => {
    const { created_by } = req.body;
    if (created_by === undefined || created_by === null || created_by === "") {
        return res.status(400).json({
            message: "created_by is required",
        });
    }
    if (!Number.isInteger(created_by)) {
        return res.status(400).json({
            message: "created_by must be an integer",
        });
    }
    const user = await prisma.user.findUnique({
        where: { id: created_by },
    });
    if (!user) {
        return res.status(404).json({
            message: "Creator user not found",
        });
    }
    next();
};
export const validateTournamentStatus = (req, res, next) => {
    const { status } = req.body;
    if (status === undefined || status === null || status === "") {
        return res.status(400).json({
            message: "Status is required",
        });
    }
    if (typeof status !== "string") {
        return res.status(400).json({
            message: "Status must be a string",
        });
    }
    if (status !== "active" && status !== "inactive") {
        return res.status(400).json({
            message: 'Status must be either "active" or "inactive"',
        });
    }
    next();
};
export const validateBracketSize = (req, res, next) => {
    const { bracket_size } = req.body;
    if (bracket_size === undefined || bracket_size === null || bracket_size === "") {
        return res.status(400).json({
            message: "bracket_size is required",
        });
    }
    if (!Number.isInteger(bracket_size) || bracket_size <= 0) {
        return res.status(400).json({
            message: "bracket_size must be a positive integer",
        });
    }
    next();
};
export const validateTournamentId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid tournament id",
        });
    }
    next();
};
