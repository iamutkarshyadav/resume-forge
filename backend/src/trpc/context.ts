import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import prisma from "../prismaClient";

export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
}

export interface AuthRequest {
  user?: User | null;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const user = (req as any).user as User | undefined;
  return { req: req as AuthRequest, res, prisma, user };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
