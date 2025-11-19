import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import prisma from "../prismaClient";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const user = (req as any).user;
  return { req, res, prisma, user };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
