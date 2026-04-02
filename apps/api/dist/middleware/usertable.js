import { prisma } from "../lib/prisma.js";
export const validateUsername = async (req, res, next) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({
            message: "Username is required",
        });
    }
    if (username.trim().length < 8) {
        return res.status(400).json({
            message: "Username must be at least 8 characters",
        });
    }
    const existingUser = await prisma.user.findFirst({
        where: { username: username.trim() },
    });
    if (existingUser) {
        return res.status(409).json({
            message: "Username already exists",
        });
    }
    req.body.username = username.trim();
    next();
};
export const validateEmail = async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({
            message: "Email is required",
        });
    }
    if (!email.includes("@")) {
        return res.status(400).json({
            message: "Email must contain @",
        });
    }
    const existingUser = await prisma.user.findUnique({
        where: { email: email.trim() },
    });
    if (existingUser) {
        return res.status(409).json({
            message: "Email already exists",
        });
    }
    req.body.email = email.trim();
    next();
};
export const validatePassword = (req, res, next) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({
            message: "Password is required",
        });
    }
    if (password.trim().length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters",
        });
    }
    next();
};
export const validateUserId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid user id",
        });
    }
    next();
};
