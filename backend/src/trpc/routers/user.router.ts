import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return user;
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      console.error("Error getting user profile:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user profile"
      });
    }
  }),
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        avatarUrl: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const updated = await ctx.prisma.user.update({
          where: { id: user.id },
          data: { name: input.name }
        });
        return updated;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error updating user profile:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user profile"
        });
      }
    })
});
