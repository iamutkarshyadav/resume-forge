"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMatch = analyzeMatch;
exports.generateForMatch = generateForMatch;
exports.getMatchById = getMatchById;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const gemini = __importStar(require("./gemini.service"));
const httpError_1 = require("../utils/httpError");
const jobDescription_service_1 = require("./jobDescription.service");
const logger_1 = require("../utils/logger");
async function analyzeMatch(user, resumeId, jdId) {
    // Validate inputs
    if (!resumeId || typeof resumeId !== "string")
        throw new httpError_1.HttpError(400, "Invalid resumeId");
    if (!jdId || typeof jdId !== "string")
        throw new httpError_1.HttpError(400, "Invalid jdId");
    // Fetch JD first, this also validates ownership
    const jd = await (0, jobDescription_service_1.getJobDescription)(user.id, jdId);
    const jdText = jd.fullText;
    const resume = await prismaClient_1.default.resume.findUnique({ where: { id: resumeId } });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    // Authorization: owner or admin
    if (resume.uploadedById !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") {
        throw new httpError_1.HttpError(403, "Forbidden: you do not have access to this resume");
    }
    let resumeText = (resume.fullText || "").trim();
    const resumeJson = resume.jsonData || {};
    if (!resumeText) {
        const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
        if (fallback)
            resumeText = fallback;
    }
    if (!resumeText)
        throw new httpError_1.HttpError(400, "Empty resume text");
    // Run main analysis with error handling
    let analysis;
    try {
        analysis = await gemini.analyzeResumeAndJD({ fullText: resumeText, jsonData: resumeJson }, jdText);
    }
    catch (err) {
        logger_1.logger.error("Gemini analysis failed in analyzeMatch", {
            error: err.message,
            resumeId,
            jdId,
            userId: user.id
        });
        throw new httpError_1.HttpError(err.status || 500, `Analysis failed: ${err.message || "Unknown error"}`);
    }
    // Validate analysis response
    if (!analysis || typeof analysis !== "object") {
        logger_1.logger.error("Invalid analysis response from Gemini", { analysis, resumeId, jdId });
        throw new httpError_1.HttpError(500, "Received invalid analysis data. Please try again.");
    }
    // Create match analysis with validated data
    let match;
    try {
        match = await prismaClient_1.default.matchAnalysis.create({
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
    }
    catch (err) {
        logger_1.logger.error("Failed to create match analysis", {
            error: err.message,
            code: err.code,
            resumeId,
            jdId,
            userId: user.id
        });
        if (err.code === "P2002") {
            throw new httpError_1.HttpError(409, "Analysis already exists for this resume and job description");
        }
        throw new httpError_1.HttpError(500, `Failed to save analysis: ${err.message || "Unknown error"}`);
    }
    if (!match || !match.id) {
        logger_1.logger.error("Match analysis created but missing ID", { match, resumeId, jdId });
        throw new httpError_1.HttpError(500, "Analysis created but failed to retrieve ID. Please try again.");
    }
    logger_1.logger.info("Match analysis created successfully", { matchId: match.id, resumeId, jdId, score: match.score });
    return match;
}
async function generateForMatch(user, resumeId, jdId) {
    if (!resumeId || typeof resumeId !== "string")
        throw new httpError_1.HttpError(400, "Invalid resumeId");
    if (!jdId || typeof jdId !== "string")
        throw new httpError_1.HttpError(400, "Invalid jdId");
    // Fetch JD first, this also validates ownership
    const jd = await (0, jobDescription_service_1.getJobDescription)(user.id, jdId);
    const jdText = jd.fullText;
    const resume = await prismaClient_1.default.resume.findUnique({ where: { id: resumeId } });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    // Authorization: owner or admin
    if (resume.uploadedById !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") {
        throw new httpError_1.HttpError(403, "Forbidden: you do not have access to this resume");
    }
    let resumeText = (resume.fullText || "").trim();
    const resumeJson = resume.jsonData || {};
    if (!resumeText) {
        const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
        if (fallback)
            resumeText = fallback;
    }
    if (!resumeText)
        throw new httpError_1.HttpError(400, "Empty resume text");
    // Generate resume with error handling
    let generated;
    try {
        generated = await gemini.generateResumeWithGemini({ fullText: resumeText, jsonData: resumeJson }, jdText);
    }
    catch (err) {
        logger_1.logger.error("Gemini generation failed in generateForMatch", {
            error: err.message,
            resumeId,
            jdId,
            userId: user.id
        });
        throw new httpError_1.HttpError(err.status || 500, `Resume generation failed: ${err.message || "Unknown error"}`);
    }
    // Validate generated data
    if (!generated || typeof generated !== "object") {
        logger_1.logger.error("Invalid generated resume data from Gemini", { generated, resumeId, jdId });
        throw new httpError_1.HttpError(500, "AI generated invalid resume data. Please try again.");
    }
    // Find existing analysis
    const existing = await prismaClient_1.default.matchAnalysis.findFirst({
        where: { userId: user.id, resumeId, jdId },
        orderBy: { createdAt: "desc" }
    });
    if (!existing) {
        logger_1.logger.warn("No prior analysis found for generation", { resumeId, jdId, userId: user.id });
        throw new httpError_1.HttpError(400, "No prior analysis found for this resume and job description. Please run analysis first.");
    }
    // Update match with generated resume
    let match;
    try {
        match = await prismaClient_1.default.matchAnalysis.update({
            where: { id: existing.id },
            data: {
                generatedResume: generated,
                jdId: jdId, // Ensure it's set
                jdText: jdText
            }
        });
    }
    catch (err) {
        logger_1.logger.error("Failed to update match with generated resume", {
            error: err.message,
            code: err.code,
            matchId: existing.id,
            resumeId,
            jdId
        });
        throw new httpError_1.HttpError(500, `Failed to save generated resume: ${err.message || "Unknown error"}`);
    }
    if (!match || !match.id) {
        logger_1.logger.error("Match updated but missing ID", { match, resumeId, jdId });
        throw new httpError_1.HttpError(500, "Generated resume saved but failed to retrieve match. Please try again.");
    }
    // Validate generated resume data before saving
    if (!generated || typeof generated !== "object") {
        logger_1.logger.error("Invalid generated resume data", { generated });
        throw new httpError_1.HttpError(500, "AI generated invalid resume data. Please try again.");
    }
    // Create a resume version from the generated resume
    // Use summary if available, otherwise create a text summary from the structured data
    let generatedText;
    if (typeof generated?.summary === "string" && generated.summary.trim()) {
        generatedText = generated.summary;
    }
    else {
        // Create a basic text representation
        const parts = [];
        if (generated.name)
            parts.push(`Name: ${generated.name}`);
        if (generated.email)
            parts.push(`Email: ${generated.email}`);
        if (generated.title)
            parts.push(`Title: ${generated.title}`);
        if (Array.isArray(generated.skills) && generated.skills.length > 0) {
            parts.push(`Skills: ${generated.skills.join(", ")}`);
        }
        generatedText = parts.length > 0 ? parts.join("\n") : "AI-generated resume";
    }
    try {
        const resumeVersionModule = await Promise.resolve().then(() => __importStar(require("./resumeVersion.service")));
        const version = await resumeVersionModule.createVersion(user.id, resumeId, generatedText, generated, "ai_generated", match.id, match.score, undefined, `Generated for JD: ${jd.title || "Job Description"}`);
        if (!version || !version.id) {
            throw new httpError_1.HttpError(500, "Failed to create resume version - no ID returned");
        }
        logger_1.logger.info("Resume version created successfully", {
            versionId: version.id,
            resumeId,
            matchId: match.id
        });
    }
    catch (err) {
        logger_1.logger.error("Failed to save generated resume version", {
            error: err.message,
            stack: err.stack,
            resumeId,
            matchId: match.id
        });
        // CRITICAL: Do not swallow this error. The user needs to know their resume wasn't saved.
        // Re-throw with a user-friendly message
        if (err instanceof httpError_1.HttpError) {
            throw err;
        }
        throw new httpError_1.HttpError(500, `Resume generated but failed to save version: ${err.message || "Unknown error"}. Please try again.`);
    }
    return { match, analysis: null, generated };
}
async function getMatchById(userId, id) {
    const match = await prismaClient_1.default.matchAnalysis.findUnique({ where: { id } });
    if (!match)
        throw new httpError_1.HttpError(404, "Analysis not found");
    // Enforce ownership check: user must own the analysis or be admin
    const isOwner = match.userId === userId;
    const isAdmin = false; // Admin check would be added here if available in context
    if (!isOwner && !isAdmin) {
        throw new httpError_1.HttpError(403, "You do not have access to this analysis");
    }
    return match;
}
