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
      return next();
    }

    if (!payload || !payload.sub) return next();

    // Select safe user fields (do not expose passwordHash)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) return next();

    req.user = user;
    return next();
  } catch (err: any) {
    console.error("JWT auth error:", err);
    return next();
  }
}
