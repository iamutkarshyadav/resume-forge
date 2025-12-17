import prisma from "../prismaClient";
import { HttpError } from "../utils/httpError";

export async function createVersion(
  userId: string,
  resumeId: string,
  fullText: string,
  jsonData: any,
  sourceType: "upload" | "ai_generated" | "manual_edit",
  sourceAnalysisId?: string,
  scoreAtCreation?: number,
  scoreImprovement?: number,
  title?: string
) {
  // Validate resume ownership
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { versions: { select: { versionNumber: true }, orderBy: { versionNumber: "desc" }, take: 1 } }
  });

  if (!resume) throw new HttpError(404, "Resume not found");
  if (resume.uploadedById !== userId) throw new HttpError(403, "Not authorized to create version");

  // Get next version number
  const lastVersion = resume.versions[0];
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  const version = await prisma.resumeVersion.create({
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

export async function listVersions(userId: string, resumeId: string) {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new HttpError(404, "Resume not found");
  if (resume.uploadedById !== userId) throw new HttpError(403, "Not authorized");

  const versions = await prisma.resumeVersion.findMany({
    where: { resumeId },
    orderBy: { createdAt: "desc" },
    include: { sourceAnalysis: true }
  });

  return versions;
}

export async function getVersion(userId: string, versionId: string) {
  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId },
    include: { resume: true, sourceAnalysis: true }
  });

  if (!version) throw new HttpError(404, "Version not found");
  if (version.resume.uploadedById !== userId) throw new HttpError(403, "Not authorized");

  return version;
}

export async function restoreVersion(userId: string, resumeId: string, fromVersionId: string) {
  const sourceVersion = await prisma.resumeVersion.findUnique({
    where: { id: fromVersionId },
    include: { resume: true }
  });

  if (!sourceVersion) throw new HttpError(404, "Source version not found");
  if (sourceVersion.resume.uploadedById !== userId) throw new HttpError(403, "Not authorized");

  // Create new version from restored version
  const newVersion = await createVersion(
    userId,
    resumeId,
    sourceVersion.fullText,
    sourceVersion.jsonData,
    "manual_edit",
    undefined,
    sourceVersion.scoreAtCreation ?? undefined,
    undefined,
    `Restored from v${sourceVersion.versionNumber}`
  );

  return newVersion;
}

export async function deleteVersion(userId: string, versionId: string) {
  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId },
    include: { resume: true }
  });

  if (!version) throw new HttpError(404, "Version not found");
  if (version.resume.uploadedById !== userId) throw new HttpError(403, "Not authorized");

  // Don't allow deleting if it's the only version
  const versionCount = await prisma.resumeVersion.count({ where: { resumeId: version.resumeId } });
  if (versionCount <= 1) throw new HttpError(400, "Cannot delete the last version");

  await prisma.resumeVersion.delete({ where: { id: versionId } });
  return { success: true };
}

export async function compareVersions(
  userId: string,
  versionId1: string,
  versionId2: string
) {
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
