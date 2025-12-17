"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockParseResume = mockParseResume;
const mammoth_1 = __importDefault(require("mammoth"));
const pdfParser_1 = require("./pdfParser");
function extractEmail(text) {
    const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return m ? m[0] : "";
}
function extractPhone(text) {
    const m = text.match(/(\+?\d[\d\s().-]{6,}\d)/);
    return m ? m[0] : "";
}
async function mockParseResume(buffer, filename) {
    const ext = (filename || "").split(".").pop()?.toLowerCase() || "";
    let text = "";
    try {
        if (ext === "pdf") {
            // Only allow text-based PDFs via extractPdfText
            text = await (0, pdfParser_1.extractPdfText)(buffer);
        }
        else if (ext === "docx") {
            const result = await mammoth_1.default.extractRawText({ buffer });
            text = result.value;
        }
        else {
            // fallback to utf8
            text = buffer.toString("utf8");
        }
    }
    catch (e) {
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
