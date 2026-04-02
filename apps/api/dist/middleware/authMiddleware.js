import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../utils/auth.js";
export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authorization token missing",
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
            },
        });
        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
