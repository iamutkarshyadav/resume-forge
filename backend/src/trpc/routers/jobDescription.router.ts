import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import * as jdService from "../../services/jobDescription.service";
import { HttpError, getErrorStatus } from "../../utils/httpError";

export const jobDescriptionRouter = router({
  save: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title required"),
        company: z.string().optional(),
        fullText: z.string().min(1, "Job description text required"),
        tags: z.array(z.string()).optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const jd = await jdService.saveJobDescription(
          user.id,
          input.title,
          input.company,
          input.fullText,
          input.tags
        );
        return jd;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error saving job description:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to save job description"
        });
      }
    }),

  list: protectedProcedure
    .input(z.object({ tag: z.string().nullish() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const jds = await jdService.listJobDescriptions(user.id, input.tag);
        return jds;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error listing job descriptions:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to list job descriptions"
        });
      }
    }),

  get: protectedProcedure
    .input(z.object({ jdId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const jd = await jdService.getJobDescription(user.id, input.jdId);
        return jd;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        const status = getErrorStatus(err);
        console.error("Error getting job description:", err);
        throw new TRPCError({
          code: status === 404 ? "NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to get job description"
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        jdId: z.string(),
        title: z.string().optional(),
        company: z.string().optional(),
        tags: z.array(z.string()).optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const updated = await jdService.updateJobDescription(user.id, input.jdId, {
          title: input.title,
          company: input.company,
          tags: input.tags
        });
        return updated;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        const status = getErrorStatus(err);
        console.error("Error updating job description:", err);
        throw new TRPCError({
          code: status === 404 ? "NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to update job description"
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ jdId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const result = await jdService.deleteJobDescription(user.id, input.jdId);
        return result;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        const status = getErrorStatus(err);
        console.error("Error deleting job description:", err);
        throw new TRPCError({
          code: status === 404 ? "NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to delete job description"
        });
      }
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const results = await jdService.searchJobDescriptions(user.id, input.query);
        return results;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error searching job descriptions:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to search job descriptions"
        });
      }
    })
});
