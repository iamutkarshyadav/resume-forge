"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserResumes = getUserResumes;
exports.getResumeById = getResumeById;
exports.deleteResume = deleteResume;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const fs_1 = __importDefault(require("fs"));
const httpError_1 = require("../utils/httpError");
async function getUserResumes(userId) {
    return prismaClient_1.default.resume.findMany({
        where: { uploadedById: userId },
        orderBy: { createdAt: "desc" }
    });
}
async function getResumeById(userId, resumeId) {
    const resume = await prismaClient_1.default.resume.findFirst({
        where: { id: resumeId, uploadedById: userId }
    });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    return resume;
}
async function deleteResume(userId, resumeId) {
    const resume = await prismaClient_1.default.resume.findFirst({ where: { id: resumeId, uploadedById: userId } });
    if (!resume)
        throw new httpError_1.HttpError(404, "Resume not found");
    const path = resume.jsonData?.path;
    if (path) {
        try {
            fs_1.default.unlinkSync(path);
        }
        catch (err) {
            // Log but don't fail - file might already be deleted
            console.error(`Failed to delete file at ${path}:`, err);
        }
    }
    await prismaClient_1.default.resume.delete({ where: { id: resumeId } });
    return { success: true };
}
