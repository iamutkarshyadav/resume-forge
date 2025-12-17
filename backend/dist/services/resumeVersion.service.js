"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVersion = createVersion;
exports.listVersions = listVersions;
exports.getVersion = getVersion;
exports.restoreVersion = restoreVersion;
exports.deleteVersion = deleteVersion;
exports.compareVersions = compareVersions;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const httpError_1 = require("../utils/httpError");
async function createVersion(userId, resumeId, fullText, jsonData, sourceType, sourceAnalysisId, scoreAtCreation, scoreImprovement, title) {
    // Validate resume ownership
    const resume = await prismaClient_1.default.resume.findUnique({
        where: { id: resumeId },
        include: { versions: { select: { versionNumber: true }, orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    if (resume.uploadedById !== userId)
        throw new httpError_1.HttpError(403, "Not authorized to create version");
    // Get next version number
    const lastVersion = resume.versions[0];
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;
    const version = await prismaClient_1.default.resumeVersion.create({
        data: {
            resumeId,
            versionNumber: nextVersionNumber,
            title: title || `Version ${nextVersionNumber}`,
            sourceType,
            sourceAnalysisId,
            fullText,
            jsonData,
            scoreAtCreation,
            scoreImprovement
        }
    });
    return version;
}
async function listVersions(userId, resumeId) {
    const resume = await prismaClient_1.default.resume.findUnique({ where: { id: resumeId } });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    if (resume.uploadedById !== userId)
        throw new httpError_1.HttpError(403, "Not authorized");
    const versions = await prismaClient_1.default.resumeVersion.findMany({
        where: { resumeId },
        orderBy: { createdAt: "desc" },
        include: { sourceAnalysis: true }
    });
    return versions;
}
async function getVersion(userId, versionId) {
    const version = await prismaClient_1.default.resumeVersion.findUnique({
        where: { id: versionId },
        include: { resume: true, sourceAnalysis: true }
    });
    if (!version)
        throw new httpError_1.HttpError(404, "Version not found");
    if (version.resume.uploadedById !== userId)
        throw new httpError_1.HttpError(403, "Not authorized");
    return version;
}
async function restoreVersion(userId, resumeId, fromVersionId) {
    const sourceVersion = await prismaClient_1.default.resumeVersion.findUnique({
        where: { id: fromVersionId },
        include: { resume: true }
    });
    if (!sourceVersion)
        throw new httpError_1.HttpError(404, "Source version not found");
    if (sourceVersion.resume.uploadedById !== userId)
        throw new httpError_1.HttpError(403, "Not authorized");
    // Create new version from restored version
    const newVersion = await createVersion(userId, resumeId, sourceVersion.fullText, sourceVersion.jsonData, "manual_edit", undefined, sourceVersion.scoreAtCreation ?? undefined, undefined, `Restored from v${sourceVersion.versionNumber}`);
    return newVersion;
}
async function deleteVersion(userId, versionId) {
    const version = await prismaClient_1.default.resumeVersion.findUnique({
        where: { id: versionId },
        include: { resume: true }
    });
    if (!version)
        throw new httpError_1.HttpError(404, "Version not found");
    if (version.resume.uploadedById !== userId)
        throw new httpError_1.HttpError(403, "Not authorized");
    // Don't allow deleting if it's the only version
    const versionCount = await prismaClient_1.default.resumeVersion.count({ where: { resumeId: version.resumeId } });
    if (versionCount <= 1)
        throw new httpError_1.HttpError(400, "Cannot delete the last version");
    await prismaClient_1.default.resumeVersion.delete({ where: { id: versionId } });
    return { success: true };
}
async function compareVersions(userId, versionId1, versionId2) {
    const v1 = await getVersion(userId, versionId1);
    const v2 = await getVersion(userId, versionId2);
    const text1Words = new Set((v1.fullText || "").toLowerCase().match(/\b\w+\b/g) || []);
    const text2Words = new Set((v2.fullText || "").toLowerCase().match(/\b\w+\b/g) || []);
    const added = Array.from(text2Words).filter(w => !text1Words.has(w));
    const removed = Array.from(text1Words).filter(w => !text2Words.has(w));
    const scoreDelta = (v2.scoreAtCreation || 0) - (v1.scoreAtCreation || 0);
    return {
        version1: v1,
        version2: v2,
        diff: {
            added,
            removed,
            scoreDelta,
            totalWordsAdded: added.length,
            totalWordsRemoved: removed.length
        }
    };
}
