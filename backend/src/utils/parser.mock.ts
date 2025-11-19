import mammoth from "mammoth";
import { extractPdfText } from "./pdfParser";

function extractEmail(text: string) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : "";
}

function extractPhone(text: string) {
  const m = text.match(/(\+?\d[\d\s().-]{6,}\d)/);
  return m ? m[0] : "";
}

export async function mockParseResume(buffer: Buffer, filename: string) {
  const ext = (filename || "").split(".").pop()?.toLowerCase() || "";
  let text = "";

  try {
    if (ext === "pdf") {
      // Only allow text-based PDFs via extractPdfText
      text = await extractPdfText(buffer as Buffer);
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      // fallback to utf8
      text = buffer.toString("utf8");
    }
  } catch (e) {
    // fallback
    text = buffer.toString("utf8");
  }

  // Basic summary extraction
  const email = extractEmail(text) || "unknown@example.com";
  const phone = extractPhone(text) || "";
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const summary = {
    name: firstLine.trim().split(/\s+/).slice(0, 3).join(" "),
    email,
    phone,
    skills: [],
    experienceYears: 0
  };

  return { text, summary };
}
