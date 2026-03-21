import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  email: string;
}

export function generateToken(payload: JwtPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
}