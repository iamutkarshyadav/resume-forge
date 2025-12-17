import prisma from "../prismaClient";

export async function getRecentMatches(userId: string, limit: number = 10) {
  const matches = await prisma.matchAnalysis.findMany({
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
    type: "match_analysis" as const,
    resumeId: match.resumeId,
    resumeFilename: match.resume?.filename,
    score: match.score,
    summary: match.summary,
    createdAt: match.createdAt,
    timestamp: match.createdAt.toISOString()
  }));
}

export async function getRecentResumes(userId: string, limit: number = 5) {
  const resumes = await prisma.resume.findMany({
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

export async function getRecentJobDescriptions(userId: string, limit: number = 5) {
  const jds = await prisma.jobDescription.findMany({
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

export async function getDashboardSummary(userId: string) {
  const resumeCount = await prisma.resume.count({ where: { uploadedById: userId } });
  const matchCount = await prisma.matchAnalysis.count({ where: { userId } });
  const jdCount = await prisma.jobDescription.count({ where: { userId } });

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
