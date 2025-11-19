import prisma from "../prismaClient";
import fs from "fs";

export async function getUserResumes(userId: string) {
  return prisma.resume.findMany({
    where: { uploadedById: userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getResumeById(userId: string, resumeId: string) {
  return prisma.resume.findFirst({
    where: { id: resumeId, uploadedById: userId }
  });
}

export async function deleteResume(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, uploadedById: userId } });
  if (!resume) throw new Error("Not found");

  const path = (resume.jsonData as any)?.path as string | undefined;
  if (path) {
    try {
      fs.unlinkSync(path);
    } catch {}
  }

  await prisma.resume.delete({ where: { id: resumeId } });
  return true;
}
