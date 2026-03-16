import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { validateUsername, validateEmail, validatePassword, validateUserId, } from "../middleware/usertable.js";
const router = Router();
// CREATE user
router.post("/", validateUsername, validateEmail, validatePassword, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password_hash: password,
            },
            select: {
                id: true,
                username: true,
                email: true,
                created_at: true,
            },
        });
        return res.status(201).json(user);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});
// GET all users
router.get("/", async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { created_at: "desc" },
            select: {
                id: true,
                username: true,
                email: true,
                created_at: true,
            },
        });
        return res.json(users);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});
// GET user by id
router.get("/:id", validateUserId, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                created_at: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});
// UPDATE user
router.patch("/:id", validateUserId, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { username, email, password } = req.body;
        if (username === undefined &&
            email === undefined &&
            password === undefined) {
            return res.status(400).json({
                message: "Provide at least one field to update",
            });
        }
        if (username !== undefined) {
            if (typeof username !== "string") {
                return res.status(400).json({ message: "Username must be a string" });
            }
            if (username.trim().length < 8) {
                return res
                    .status(400)
                    .json({ message: "Username must be at least 8 characters" });
            }
            const existingUsername = await prisma.user.findFirst({
                where: { username: username.trim() },
            });
            if (existingUsername && existingUsername.id !== id) {
                return res.status(409).json({ message: "Username already exists" });
            }
        }
        if (email !== undefined) {
            if (typeof email !== "string") {
                return res.status(400).json({ message: "Email must be a string" });
            }
            if (!email.includes("@")) {
                return res.status(400).json({ message: "Email must contain @" });
            }
            const existingEmail = await prisma.user.findUnique({
                where: { email: email.trim() },
            });
            if (existingEmail && existingEmail.id !== id) {
                return res.status(409).json({ message: "Email already exists" });
            }
        }
        if (password !== undefined) {
            if (typeof password !== "string") {
                return res.status(400).json({ message: "Password must be a string" });
            }
            if (password.trim().length < 1) {
                return res.status(400).json({ message: "Password is required" });
            }
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(username !== undefined && { username: username.trim() }),
                ...(email !== undefined && { email: email.trim() }),
                ...(password !== undefined && { password_hash: password }),
            },
            select: {
                id: true,
                username: true,
                email: true,
                created_at: true,
            },
        });
        return res.json(updatedUser);
    }
    catch (err) {
        if (err?.code === "P2025") {
            return res.status(404).json({ message: "User not found" });
        }
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});
// DELETE user
router.delete("/:id", validateUserId, async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.user.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (err) {
        if (err?.code === "P2025") {
            return res.status(404).json({ message: "User not found" });
        }
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});
export default router;
