import prisma from "../prismaClient";
import { HttpError } from "../utils/httpError";
import * as gemini from "./gemini.service";

export async function saveJobDescription(
  userId: string,
  title: string,
  company: string | undefined,
  fullText: string,
  tags: string[] = []
) {
  if (!fullText || fullText.trim().length === 0) {
    throw new HttpError(400, "Job description text is required");
  }

  // Extract key skills from JD using Gemini
  let keySkills: string[] = [];
  try {
    const extraction = await gemini.extractSkillsFromJD(fullText);
    keySkills = extraction.skills || [];
  } catch (err) {
    // Graceful fallback - just use empty array
    keySkills = [];
  }

  const jd = await prisma.jobDescription.create({
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

export async function listJobDescriptions(userId: string, tag?: string) {
  const where: any = { userId };
  
  if (tag) {
    where.tags = { has: tag };
  }

  const jds = await prisma.jobDescription.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  return jds;
}

export async function getJobDescription(userId: string, jdId: string) {
  const jd = await prisma.jobDescription.findUnique({ where: { id: jdId } });

  if (!jd) throw new HttpError(404, "Job description not found");
  if (jd.userId !== userId) throw new HttpError(403, "Not authorized");

  return jd;
}

export async function updateJobDescription(
  userId: string,
  jdId: string,
  data: {
    title?: string;
    company?: string;
    tags?: string[];
  }
) {
  const jd = await prisma.jobDescription.findUnique({ where: { id: jdId } });

  if (!jd) throw new HttpError(404, "Job description not found");
  if (jd.userId !== userId) throw new HttpError(403, "Not authorized");

  const updated = await prisma.jobDescription.update({
    where: { id: jdId },
    data: {
      title: data.title || jd.title,
      company: data.company !== undefined ? data.company : jd.company,
      tags: data.tags || jd.tags
    }
  });

  return updated;
}

export async function deleteJobDescription(userId: string, jdId: string) {
  const jd = await prisma.jobDescription.findUnique({ where: { id: jdId } });

  if (!jd) throw new HttpError(404, "Job description not found");
  if (jd.userId !== userId) throw new HttpError(403, "Not authorized");

  await prisma.jobDescription.delete({ where: { id: jdId } });
  return { success: true };
}

export async function searchJobDescriptions(userId: string, query: string) {
  // Database-level search: use case-insensitive filters
  if (!query || query.trim().length === 0) {
    return listJobDescriptions(userId);
  }

  const queryLower = query.toLowerCase();

  const jds = await prisma.jobDescription.findMany({
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
