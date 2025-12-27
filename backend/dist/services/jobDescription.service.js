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
exports.saveJobDescription = saveJobDescription;
exports.listJobDescriptions = listJobDescriptions;
exports.getJobDescription = getJobDescription;
exports.updateJobDescription = updateJobDescription;
exports.deleteJobDescription = deleteJobDescription;
exports.searchJobDescriptions = searchJobDescriptions;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const httpError_1 = require("../utils/httpError");
const gemini = __importStar(require("./gemini.service"));
async function saveJobDescription(userId, title, company, fullText, tags = []) {
    if (!fullText || fullText.trim().length === 0) {
        throw new httpError_1.HttpError(400, "Job description text is required");
    }
    // Extract key skills from JD using Gemini
    let keySkills = [];
    try {
        const extraction = await gemini.extractSkillsFromJD(fullText);
        keySkills = extraction.skills || [];
    }
    catch (err) {
        // Graceful fallback - just use empty array
        keySkills = [];
    }
    const jd = await prismaClient_1.default.jobDescription.create({
        data: {
            userId,
            title,
            company: company || null,
            fullText,
            tags: tags.filter(t => t.trim().length > 0),
            keySkills
        }
    });
    return jd;
}
async function listJobDescriptions(userId, tag) {
    const where = { userId };
    if (tag) {
        where.tags = { has: tag };
    }
    const jds = await prismaClient_1.default.jobDescription.findMany({
        where,
        orderBy: { createdAt: "desc" }
    });
    return jds;
}
async function getJobDescription(userId, jdId) {
    const jd = await prismaClient_1.default.jobDescription.findUnique({ where: { id: jdId } });
    if (!jd)
        throw new httpError_1.HttpError(404, "Job description not found");
    if (jd.userId !== userId)
        throw new httpError_1.HttpError(403, "Not authorized");
    return jd;
}
async function updateJobDescription(userId, jdId, data) {
    const jd = await prismaClient_1.default.jobDescription.findUnique({ where: { id: jdId } });
    if (!jd)
        throw new httpError_1.HttpError(404, "Job description not found");
    if (jd.userId !== userId)
        throw new httpError_1.HttpError(403, "Not authorized");
    const updated = await prismaClient_1.default.jobDescription.update({
        where: { id: jdId },
        data: {
            title: data.title || jd.title,
            company: data.company !== undefined ? data.company : jd.company,
            tags: data.tags || jd.tags
        }
    });
    return updated;
}
async function deleteJobDescription(userId, jdId) {
    const jd = await prismaClient_1.default.jobDescription.findUnique({ where: { id: jdId } });
    if (!jd)
        throw new httpError_1.HttpError(404, "Job description not found");
    if (jd.userId !== userId)
        throw new httpError_1.HttpError(403, "Not authorized");
    await prismaClient_1.default.jobDescription.delete({ where: { id: jdId } });
    return { success: true };
}
async function searchJobDescriptions(userId, query) {
    // Database-level search: use case-insensitive filters
    if (!query || query.trim().length === 0) {
        return listJobDescriptions(userId);
    }
    const queryLower = query.toLowerCase();
    const jds = await prismaClient_1.default.jobDescription.findMany({
        where: {
            userId,
            OR: [
                { title: { contains: queryLower, mode: "insensitive" } },
                { company: { contains: queryLower, mode: "insensitive" } },
                { tags: { has: queryLower } }
            ]
        },
        orderBy: { createdAt: "desc" }
    });
    return jds;
}
