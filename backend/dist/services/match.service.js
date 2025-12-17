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
async function analyzeMatch(user, resumeId, jdText, jdId) {
    // Validate inputs
    if (!resumeId || typeof resumeId !== "string")
        throw new httpError_1.HttpError(400, "Invalid resumeId");
    if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0)
        throw new httpError_1.HttpError(400, "Empty job description text");
    const resume = await prismaClient_1.default.resume.findUnique({ where: { id: resumeId } });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    // Authorization: owner or admin
    const ownerId = resume.uploadedById;
    if (!ownerId)
        throw new httpError_1.HttpError(400, "Resume has no owner");
    if (ownerId !== user.id && String(user.role || "").toUpperCase() !== "ADMIN")
        throw new httpError_1.HttpError(403, "Forbidden: you do not have access to this resume");
    let resumeText = (resume.fullText || "").trim();
    const resumeJson = resume.jsonData || {};
    if (!resumeText) {
        const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
        if (fallback)
            resumeText = fallback;
    }
    if (!resumeText)
        throw new httpError_1.HttpError(400, "Empty resume text");
    // Run main analysis
    const analysis = await gemini.analyzeWithGemini({ fullText: resumeText, jsonData: resumeJson }, jdText);
    // Calculate additional metrics
    const completenessScore = await gemini.calculateCompletenessScore(resumeText);
    const jdRealismScore = await gemini.calculateJDRealismScore(jdText);
    const hasKeywordStuffing = await gemini.detectKeywordStuffing(resumeText);
    const match = await prismaClient_1.default.matchAnalysis.create({
        data: {
            userId: user.id,
            resumeId,
            jdId: jdId || undefined,
            jdText: jdText,
            summary: typeof analysis.summary === "string" ? analysis.summary : "",
            score: typeof analysis.score === "number" ? Math.max(0, Math.min(100, Math.round(analysis.score))) : 0,
            strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
            weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
            missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
            recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
            completenessScore,
            jdRealismScore,
            hasKeywordStuffing
        }
    });
    return { match, analysis, generated: null };
}
async function generateForMatch(user, resumeId, jdText) {
    if (!resumeId || typeof resumeId !== "string")
        throw new httpError_1.HttpError(400, "Invalid resumeId");
    if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0)
        throw new httpError_1.HttpError(400, "Empty job description text");
    const resume = await prismaClient_1.default.resume.findUnique({ where: { id: resumeId } });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    const ownerId = resume.uploadedById;
    if (!ownerId)
        throw new httpError_1.HttpError(400, "Resume has no owner");
    if (ownerId !== user.id && String(user.role || "").toUpperCase() !== "ADMIN")
        throw new httpError_1.HttpError(403, "Forbidden: you do not have access to this resume");
    let resumeText = (resume.fullText || "").trim();
    const resumeJson = resume.jsonData || {};
    if (!resumeText) {
        const fallback = (resumeJson?.pdf?.allText || resumeJson?._allText || "").trim();
        if (fallback)
            resumeText = fallback;
    }
    if (!resumeText)
        throw new httpError_1.HttpError(400, "Empty resume text");
    const generated = await gemini.generateResumeWithGemini({ fullText: resumeText, jsonData: resumeJson }, jdText);
    const existing = await prismaClient_1.default.matchAnalysis.findFirst({
        where: { userId: user.id, resumeId },
        orderBy: { createdAt: "desc" }
    });
    if (!existing) {
        throw new httpError_1.HttpError(400, "No prior analysis found for this resume. Run analyze first.");
    }
    const match = await prismaClient_1.default.matchAnalysis.update({
        where: { id: existing.id },
        data: {
            generatedResume: generated,
            jdText: jdText
        }
    });
    // Create a resume version from the generated resume
    const generatedText = typeof generated?.summary === "string" ? generated.summary : JSON.stringify(generated);
    try {
        const resumeVersionModule = await Promise.resolve().then(() => __importStar(require("./resumeVersion.service")));
        await resumeVersionModule.createVersion(user.id, resumeId, generatedText, generated, "ai_generated", match.id, match.score, undefined, `Generated for JD match`);
    }
    catch (err) {
        // Graceful failure - don't block if version creation fails
        console.error("Failed to create resume version:", err);
    }
    return { match, analysis: null, generated };
}
async function getMatchById(id) {
    const match = await prismaClient_1.default.matchAnalysis.findUnique({ where: { id } });
    return match;
}
