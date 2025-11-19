import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        avatarUrl: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { name: input.name }
      });
      return updated;
    })
});
