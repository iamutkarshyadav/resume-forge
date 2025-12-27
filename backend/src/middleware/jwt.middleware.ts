import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../utils/env";
import prisma from "../prismaClient";

export interface AuthRequest extends Request {
  user?: any;
}

export async function jwtAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    // Accept formats: "Bearer <token>" or raw token
    const parts = authHeader.split(" ").filter(Boolean);
    const token = parts.length === 1 ? parts[0] : parts[1];
    if (!token) return next();

    let payload: any;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET) as { sub: string; iat: number; exp: number };
    } catch (err) {
      console.warn("JWT verification failed:", (err as any)?.message);
      // Don't call next() - token was provided but invalid
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!payload || !payload.sub) {
      console.warn("JWT payload missing or invalid");
      // Token was provided but payload is invalid
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Select safe user fields (do not expose passwordHash)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      console.warn(`User not found for JWT sub: ${payload.sub}`);
      // Token was valid but user doesn't exist
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    return next();
  } catch (err: any) {
    console.error("JWT auth middleware error:", err?.message || err);
    return res.status(500).json({ message: "Authentication error" });
  }
}
