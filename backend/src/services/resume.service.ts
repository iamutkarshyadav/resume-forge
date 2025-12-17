import prisma from "../prismaClient";
import fs from "fs";
import { HttpError } from "../utils/httpError";

export async function getUserResumes(userId: string) {
  return prisma.resume.findMany({
    where: { uploadedById: userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getResumeById(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, uploadedById: userId }
  });
  if (!resume) throw new HttpError(404, "Resume not found");
  return resume;
}

export async function deleteResume(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, uploadedById: userId } });
  if (!resume) throw new HttpError(404, "Resume not found");

  const path = (resume.jsonData as any)?.path as string | undefined;
  if (path) {
    try {
      fs.unlinkSync(path);
    } catch (err) {
      // Log but don't fail - file might already be deleted
      console.error(`Failed to delete file at ${path}:`, err);
    }
  }

  await prisma.resume.delete({ where: { id: resumeId } });
  return { success: true };
}
