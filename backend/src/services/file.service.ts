import fs from "fs";
import prisma from "../prismaClient";
import path from "path";
import { extractPdfText } from "../utils/pdfParser";
import { toStructuredJSON } from "../utils/resume.parser";
import { mockParseResume } from "../utils/parser.mock";

export async function parseAndSaveResume(
  file: Express.Multer.File,
  userId: string
) {
  const buffer = await fs.promises.readFile(file.path);
  const ext = path.extname(file.originalname).toLowerCase();

  let text = "";
  try {
    if (ext === ".pdf") {
      try {
        const pdfText = await extractPdfText(buffer as Buffer);
        text = (pdfText || "").trim();
      } catch (innerErr: any) {
        const msg = String(innerErr?.message || "");
        if (msg === "PDF is not text-based" || innerErr?.code === "SCANNED_PDF") {
          const err: any = new Error("PDF is not text-based");
          err.status = 400;
          throw err;
        }
        throw innerErr;
      }
    } else if (ext === ".docx") {
      const parsed = await mockParseResume(buffer, file.originalname);
      text = (parsed.text || "").trim();
      if (!text) {
        const err: any = new Error("Unable to extract text from DOCX. Please upload a valid document.");
        err.status = 400;
        throw err;
      }
    } else if (ext === ".txt" || ext === ".md") {
      text = buffer.toString("utf8");
    } else {
      text = buffer.toString("utf8");
    }
  } catch (e) {
    if ((e as any)?.status) throw e;
    const err: any = new Error("Failed to process uploaded file");
    err.status = 500;
    err.details = (e as any)?.message || String(e);
    throw err;
  }

  text = (text || "").replace(/\u0000/g, "").trim();

  // Validation: ensure we did not accidentally store raw PDF binary
  const binaryPdfRegex = /%PDF-/;
  if (binaryPdfRegex.test(text) || text.indexOf("%PDF") !== -1) {
    const err: any = new Error("Uploaded resume appears to contain raw PDF binary data. Ensure the file is a readable PDF or text document.");
    err.status = 400;
    throw err;
  }

  const jsonStructured = toStructuredJSON(text || "");
  const jsonData: any = { ...jsonStructured, path: file.path };

  const resume = await prisma.resume.create({
    data: {
      filename: file.originalname,
      sizeKB: file.size / 1024,
      fullText: text,
      uploadedById: userId,
      jsonData: jsonData
    }
  });

  return { resume, parsed: { text, json: jsonData } };
}
