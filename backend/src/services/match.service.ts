import prisma from "../prismaClient";
import * as gemini from "./gemini.service";
import { HttpError } from "../utils/httpError";
import { getJobDescription } from "./jobDescription.service";
import { logger } from "../utils/logger";

export async function analyzeMatch(user: { id: string; role?: string }, resumeId: string, jdId: string) {
  // Validate inputs
  if (!resumeId || typeof resumeId !== "string") throw new HttpError(400, "Invalid resumeId");
  if (!jdId || typeof jdId !== "string") throw new HttpError(400, "Invalid jdId");

  // Fetch JD first, this also validates ownership
  const jd = await getJobDescription(user.id, jdId);
  const jdText = jd.fullText;

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new HttpError(404, "Resume not found");

  // Authorization: owner or admin
  if (resume.uploadedById !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") {
    throw new HttpError(403, "Forbidden: you do not have access to this resume");
  }

  let resumeText = (resume.fullText || "").trim();
  const resumeJson = (resume.jsonData as any) || {};
  if (!resumeText) {
    const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
    if (fallback) resumeText = fallback;
  }
  if (!resumeText) throw new HttpError(400, "Empty resume text");

  // Run main analysis with error handling
  let analysis: any;
  try {
    analysis = await gemini.analyzeResumeAndJD({ fullText: resumeText, jsonData: resumeJson }, jdText);
  } catch (err: any) {
    logger.error("Gemini analysis failed in analyzeMatch", { 
      error: err.message, 
      resumeId, 
      jdId,
      userId: user.id 
    });
    throw new HttpError(err.status || 500, `Analysis failed: ${err.message || "Unknown error"}`);
  }

  // Validate analysis response
  if (!analysis || typeof analysis !== "object") {
    logger.error("Invalid analysis response from Gemini", { analysis, resumeId, jdId });
    throw new HttpError(500, "Received invalid analysis data. Please try again.");
  }

  // Create match analysis with validated data
  let match;
  try {
    match = await prisma.matchAnalysis.create({
      data: {
        userId: user.id,
        resumeId,
        jdId: jdId,
        jdText: jdText,
        summary: typeof analysis.summary === "string" ? analysis.summary : "",
        score: typeof analysis.score === "number" ? Math.max(0, Math.min(100, Math.round(analysis.score))) : 0,
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter(s => s && typeof s === "string") : [],
        weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses.filter(w => w && typeof w === "string") : [],
        missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills.filter(s => s && typeof s === "string") : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.filter(r => r && typeof r === "string") : [],
        completenessScore: typeof analysis.completenessScore === "number" ? Math.max(0, Math.min(100, analysis.completenessScore)) : null,
        jdRealismScore: typeof analysis.jdRealismScore === "number" ? Math.max(0, Math.min(100, analysis.jdRealismScore)) : null,
        hasKeywordStuffing: typeof analysis.hasKeywordStuffing === "boolean" ? analysis.hasKeywordStuffing : false
      }
    });
  } catch (err: any) {
    logger.error("Failed to create match analysis", { 
      error: err.message, 
      code: err.code,
      resumeId, 
      jdId,
      userId: user.id 
    });
    
    if (err.code === "P2002") {
      throw new HttpError(409, "Analysis already exists for this resume and job description");
    }
    throw new HttpError(500, `Failed to save analysis: ${err.message || "Unknown error"}`);
  }

  if (!match || !match.id) {
    logger.error("Match analysis created but missing ID", { match, resumeId, jdId });
    throw new HttpError(500, "Analysis created but failed to retrieve ID. Please try again.");
  }

  logger.info("Match analysis created successfully", { matchId: match.id, resumeId, jdId, score: match.score });
  return match;
}

/**
 * Internal version for Job Worker - avoids HttpError
 */
export async function analyzeMatchInternal(userId: string, data: { resumeId: string; jdId: string }) {
  const { resumeId, jdId } = data;
  return analyzeMatch({ id: userId }, resumeId, jdId);
}

export async function generateForMatch(user: { id: string; role?: string }, resumeId: string, jdId: string) {
  if (!resumeId || typeof resumeId !== "string") throw new HttpError(400, "Invalid resumeId");
  if (!jdId || typeof jdId !== "string") throw new HttpError(400, "Invalid jdId");
  
  // Fetch JD first, this also validates ownership
  const jd = await getJobDescription(user.id, jdId);
  const jdText = jd.fullText;

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new HttpError(404, "Resume not found");

  // Authorization: owner or admin
  if (resume.uploadedById !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") {
    throw new HttpError(403, "Forbidden: you do not have access to this resume");
  }

  let resumeText = (resume.fullText || "").trim();
  const resumeJson = (resume.jsonData as any) || {};
  if (!resumeText) {
    const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
    if (fallback) resumeText = fallback;
  }
  if (!resumeText) throw new HttpError(400, "Empty resume text");

  // Generate resume with error handling
  let generated: any;
  try {
    generated = await gemini.generateResumeWithGemini({ fullText: resumeText, jsonData: resumeJson }, jdText);
  } catch (err: any) {
    logger.error("Gemini generation failed in generateForMatch", { 
      error: err.message, 
      resumeId, 
      jdId,
      userId: user.id 
    });
    throw new HttpError(err.status || 500, `Resume generation failed: ${err.message || "Unknown error"}`);
  }

  // Validate generated data
  if (!generated || typeof generated !== "object") {
    logger.error("Invalid generated resume data from Gemini", { generated, resumeId, jdId });
    throw new HttpError(500, "AI generated invalid resume data. Please try again.");
  }

  // Find existing analysis
  const existing = await prisma.matchAnalysis.findFirst({
    where: { userId: user.id, resumeId, jdId },
    orderBy: { createdAt: "desc" }
  });
  
  if (!existing) {
    logger.warn("No prior analysis found for generation", { resumeId, jdId, userId: user.id });
    throw new HttpError(400, "No prior analysis found for this resume and job description. Please run analysis first.");
  }

  // Update match with generated resume
  let match;
  try {
    match = await prisma.matchAnalysis.update({
      where: { id: existing.id },
      data: {
        generatedResume: generated,
        jdId: jdId, // Ensure it's set
        jdText: jdText
      }
    });
  } catch (err: any) {
    logger.error("Failed to update match with generated resume", { 
      error: err.message, 
      code: err.code,
      matchId: existing.id,
      resumeId, 
      jdId 
    });
    throw new HttpError(500, `Failed to save generated resume: ${err.message || "Unknown error"}`);
  }

  if (!match || !match.id) {
    logger.error("Match updated but missing ID", { match, resumeId, jdId });
    throw new HttpError(500, "Generated resume saved but failed to retrieve match. Please try again.");
  }

  // Validate generated resume data before saving
  if (!generated || typeof generated !== "object") {
    logger.error("Invalid generated resume data", { generated });
    throw new HttpError(500, "AI generated invalid resume data. Please try again.");
  }

  // Create a resume version from the generated resume
  // Use summary if available, otherwise create a text summary from the structured data
  let generatedText: string;
  if (typeof generated?.summary === "string" && generated.summary.trim()) {
    generatedText = generated.summary;
  } else {
    // Create a basic text representation
    const parts: string[] = [];
    if (generated.name) parts.push(`Name: ${generated.name}`);
    if (generated.email) parts.push(`Email: ${generated.email}`);
    if (generated.title) parts.push(`Title: ${generated.title}`);
    if (Array.isArray(generated.skills) && generated.skills.length > 0) {
      parts.push(`Skills: ${generated.skills.join(", ")}`);
    }
    generatedText = parts.length > 0 ? parts.join("\n") : "AI-generated resume";
  }

  try {
    const resumeVersionModule = await import("./resumeVersion.service");
    const version = await resumeVersionModule.createVersion(
      user.id,
      resumeId,
      generatedText,
      generated,
      "ai_generated",
      match.id,
      match.score,
      undefined,
      `Generated for JD: ${jd.title || "Job Description"}`
    );
    
    if (!version || !version.id) {
      throw new HttpError(500, "Failed to create resume version - no ID returned");
    }
    
    logger.info("Resume version created successfully", { 
      versionId: version.id, 
      resumeId, 
      matchId: match.id 
    });
  } catch (err: any) {
    logger.error("Failed to save generated resume version", { 
      error: err.message, 
      stack: err.stack,
      resumeId,
      matchId: match.id 
    });
    
    // CRITICAL: Do not swallow this error. The user needs to know their resume wasn't saved.
    // Re-throw with a user-friendly message
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(500, `Resume generated but failed to save version: ${err.message || "Unknown error"}. Please try again.`);
  }

  return { match, analysis: null, generated };
}

/**
 * Internal version for Job Worker - avoids HttpError
 */
export async function generateForMatchInternal(userId: string, data: { resumeId: string; jdId: string }) {
  const { resumeId, jdId } = data;
  return generateForMatch({ id: userId }, resumeId, jdId);
}

export async function getMatchById(userId: string, id: string) {
  const match = await prisma.matchAnalysis.findUnique({ where: { id } });
  if (!match) throw new HttpError(404, "Analysis not found");

  if (match.userId !== userId) {
    throw new HttpError(403, "You do not have access to this analysis");
  }

  return match;
}
