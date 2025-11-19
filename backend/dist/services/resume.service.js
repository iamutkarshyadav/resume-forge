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
async function getUserResumes(userId) {
    return prismaClient_1.default.resume.findMany({
        where: { uploadedById: userId },
        orderBy: { createdAt: "desc" }
    });
}
async function getResumeById(userId, resumeId) {
    return prismaClient_1.default.resume.findFirst({
        where: { id: resumeId, uploadedById: userId }
    });
}
async function deleteResume(userId, resumeId) {
    const resume = await prismaClient_1.default.resume.findFirst({ where: { id: resumeId, uploadedById: userId } });
    if (!resume)
        throw new Error("Not found");
    const path = resume.jsonData?.path;
    if (path) {
        try {
            fs_1.default.unlinkSync(path);
        }
        catch { }
    }
    await prismaClient_1.default.resume.delete({ where: { id: resumeId } });
    return true;
}
