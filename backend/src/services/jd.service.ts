import fs from "fs";
import prisma from "../prismaClient";
import { mockParseResume } from "../utils/parser.mock";

export async function parseJDFile(file: Express.Multer.File) {
  const buffer = await fs.promises.readFile(file.path);
  // Reuse parser to extract text from the job description file
  const parsed = await mockParseResume(buffer, file.originalname);
  return parsed.text;
}

export async function saveJobDescription(userId: string, fullText: string) {
  const jd = await prisma.jobDescription.create({
    data: {
      userId,
      title: "Untitled Job", // Required field
      fullText
    }
  });
  return jd;
}
