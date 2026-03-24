import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateUserId } from "../middleware/usertable.js";

const router = Router();

// GET all users
router.get("/", requireAuth, async (_req, res) => {
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET user by id
router.get("/:id", requireAuth, validateUserId, async (req, res) => {
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// UPDATE user
router.patch("/:id", requireAuth, validateUserId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ message: "You can only update your own account" });
    }

    const { username, email, password } = req.body;

    if (
      username === undefined &&
      email === undefined &&
      password === undefined
    ) {
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

    let hashedPassword: string | undefined;

    if (password !== undefined) {
      if (typeof password !== "string") {
        return res.status(400).json({ message: "Password must be a string" });
      }

      if (password.trim().length < 1) {
        return res.status(400).json({ message: "Password is required" });
      }

      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(username !== undefined && { username: username.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(hashedPassword !== undefined && { password_hash: hashedPassword }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        created_at: true,
      },
    });

    return res.json(updatedUser);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE user
router.delete("/:id", requireAuth, validateUserId, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ message: "You can only delete your own account" });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;