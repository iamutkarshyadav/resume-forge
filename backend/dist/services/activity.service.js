"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentMatches = getRecentMatches;
exports.getRecentResumes = getRecentResumes;
exports.getRecentJobDescriptions = getRecentJobDescriptions;
exports.getDashboardSummary = getDashboardSummary;
const prismaClient_1 = __importDefault(require("../prismaClient"));
async function getRecentMatches(userId, limit = 10) {
    const matches = await prismaClient_1.default.matchAnalysis.findMany({
        where: { userId },
        select: {
            id: true,
            resumeId: true,
            jdId: true,
            score: true,
            summary: true,
            createdAt: true,
            resume: {
                select: { id: true, filename: true }
            }
        },
        orderBy: { createdAt: "desc" },
        take: limit
    });
    return matches.map(match => ({
        id: match.id,
        type: "match_analysis",
        resumeId: match.resumeId,
        resumeFilename: match.resume?.filename,
        score: match.score,
        summary: match.summary,
        createdAt: match.createdAt,
        timestamp: match.createdAt.toISOString()
    }));
}
async function getRecentResumes(userId, limit = 5) {
    const resumes = await prismaClient_1.default.resume.findMany({
        where: { uploadedById: userId },
        select: {
            id: true,
            filename: true,
            createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: limit
    });
    return resumes;
}
async function getRecentJobDescriptions(userId, limit = 5) {
    const jds = await prismaClient_1.default.jobDescription.findMany({
        where: { userId },
        select: {
            id: true,
            title: true,
            company: true,
            createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: limit
    });
    return jds;
}
async function getDashboardSummary(userId) {
    const resumeCount = await prismaClient_1.default.resume.count({ where: { uploadedById: userId } });
    const matchCount = await prismaClient_1.default.matchAnalysis.count({ where: { userId } });
    const jdCount = await prismaClient_1.default.jobDescription.count({ where: { userId } });
    const recentMatches = await getRecentMatches(userId, 3);
    const recentResumes = await getRecentResumes(userId, 3);
    return {
        resumeCount,
        matchCount,
        jdCount,
        recentMatches,
        recentResumes
    };
}
