import prisma from "../prismaClient";
import * as gemini from "./gemini.service";
import { HttpError } from "../utils/httpError";

export async function analyzeMatch(user: { id: string; role?: string }, resumeId: string, jdText: string) {
  // Validate inputs
  if (!resumeId || typeof resumeId !== "string") throw new HttpError(400, "Invalid resumeId");
  if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) throw new HttpError(400, "Empty job description text");

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new HttpError(404, "Resume not found");

  // Authorization: owner or admin
  const ownerId = resume.uploadedById as string | undefined;
  if (!ownerId) throw new HttpError(400, "Resume has no owner");
  if (ownerId !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") throw new HttpError(403, "Forbidden: you do not have access to this resume");

  let resumeText = (resume.fullText || "").trim();
  const resumeJson = (resume.jsonData as any) || {};
  if (!resumeText) {
    const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
    if (fallback) resumeText = fallback;
  }
  if (!resumeText) throw new HttpError(400, "Empty resume text");

  const analysis = await gemini.analyzeWithGemini({ fullText: resumeText, jsonData: resumeJson }, jdText);

  const match = await prisma.matchAnalysis.create({
    data: {
      userId: user.id,
      resumeId,
      jdId: undefined,
      jdText: jdText,
      summary: typeof analysis.summary === "string" ? analysis.summary : "",
      score: typeof analysis.score === "number" ? Math.max(0, Math.min(100, Math.round(analysis.score))) : 0,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
    }
  });

  return { match, analysis, generated: null };
}

export async function generateForMatch(user: { id: string; role?: string }, resumeId: string, jdText: string) {
  if (!resumeId || typeof resumeId !== "string") throw new HttpError(400, "Invalid resumeId");
  if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) throw new HttpError(400, "Empty job description text");

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new HttpError(404, "Resume not found");

  const ownerId = resume.uploadedById as string | undefined;
  if (!ownerId) throw new HttpError(400, "Resume has no owner");
  if (ownerId !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") throw new HttpError(403, "Forbidden: you do not have access to this resume");

  let resumeText = (resume.fullText || "").trim();
  const resumeJson = (resume.jsonData as any) || {};
  if (!resumeText) {
    const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
    if (fallback) resumeText = fallback;
  }
  if (!resumeText) throw new HttpError(400, "Empty resume text");

  const generated = await gemini.generateResumeWithGemini({ fullText: resumeText, jsonData: resumeJson }, jdText);

  const existing = await prisma.matchAnalysis.findFirst({
    where: { userId: user.id, resumeId },
    orderBy: { createdAt: "desc" }
  });
  if (!existing) {
    throw new HttpError(400, "No prior analysis found for this resume. Run analyze first.");
  }

  const match = await prisma.matchAnalysis.update({
    where: { id: existing.id },
    data: {
      generatedResume: generated,
      jdText: jdText
    }
  });

  return { match, analysis: null, generated };
}

export async function getMatchById(id: string) {
  const match = await prisma.matchAnalysis.findUnique({ where: { id } });
  return match;
}
