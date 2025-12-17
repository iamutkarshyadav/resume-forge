"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPdfText = extractPdfText;
async function extractPdfText(buffer) {
    // Use only pdf-parse for text-based PDFs
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    try {
        const data = await pdfParse(buffer);
        const rawText = (data && data.text) ? String(data.text) : "";
        const cleaned = rawText
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
            .replace(/%PDF-[0-9.]+/g, "")
            .trim();
        if (cleaned && cleaned.length >= 20 && !/%PDF-/.test(cleaned)) {
            return cleaned;
        }
        const err = new Error("PDF is not text-based");
        err.code = "SCANNED_PDF";
        throw err;
    }
    catch (e) {
        const err = new Error("PDF is not text-based");
        err.code = "SCANNED_PDF";
        err.details = e?.message || String(e);
        throw err;
    }
}
