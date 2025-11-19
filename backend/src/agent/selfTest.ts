import fs from "fs";
import path from "path";
import { extractPdfText } from "../utils/pdfParser";
import { toStructuredJSON } from "../utils/resume.parser";

async function runSelfTest() {
  try {
    const sample = path.resolve(process.cwd(), "uploads", "1761899857552-resume.pdf");
    if (!fs.existsSync(sample)) {
      console.error("Sample file not found:", sample);
      process.exit(2);
    }

    const buffer = await fs.promises.readFile(sample);
    const text = await extractPdfText(buffer as Buffer);
    const cleanText = (text || "").replace(/\u0000/g, "").trim();

    console.log("--- Self-test: PDF parsing ---");
    console.log("Sample:", sample);

    if (/%PDF-/.test(cleanText) || cleanText.indexOf("%PDF") !== -1) {
      console.error("FAIL: Extracted fullText contains raw PDF marker '%PDF'.");
      process.exit(3);
    } else {
      console.log("PASS: No '%PDF' marker found in extracted text.");
    }

    const json = toStructuredJSON(cleanText);
    const required = ["name", "email", "phone", "skills", "experience", "education"];
    const missing = required.filter((k) => (json as any)[k] === undefined);
    if (missing.length > 0) {
      console.error("FAIL: Structured JSON is missing fields:", missing);
      process.exit(4);
    } else {
      console.log("PASS: Structured JSON contains required fields.");
    }

    console.log("Extracted name:", (json as any).name);
    console.log("Extracted email:", (json as any).email);
    console.log("Extracted phone:", (json as any).phone);

    console.log("Self-test completed successfully.");
    process.exit(0);
  } catch (e: any) {
    console.error("Self-test error:", e && e.message ? e.message : e);
    process.exit(1);
  }
}

if (require.main === module) {
  runSelfTest();
}

export { runSelfTest };
