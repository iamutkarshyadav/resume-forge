"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSelfTest = runSelfTest;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdfParser_1 = require("../utils/pdfParser");
const resume_parser_1 = require("../utils/resume.parser");
async function runSelfTest() {
    try {
        const sample = path_1.default.resolve(process.cwd(), "uploads", "1761899857552-resume.pdf");
        if (!fs_1.default.existsSync(sample)) {
            console.error("Sample file not found:", sample);
            process.exit(2);
        }
        const buffer = await fs_1.default.promises.readFile(sample);
        const text = await (0, pdfParser_1.extractPdfText)(buffer);
        const cleanText = (text || "").replace(/\u0000/g, "").trim();
        console.log("--- Self-test: PDF parsing ---");
        console.log("Sample:", sample);
        if (/%PDF-/.test(cleanText) || cleanText.indexOf("%PDF") !== -1) {
            console.error("FAIL: Extracted fullText contains raw PDF marker '%PDF'.");
            process.exit(3);
        }
        else {
            console.log("PASS: No '%PDF' marker found in extracted text.");
        }
        const json = (0, resume_parser_1.toStructuredJSON)(cleanText);
        const required = ["name", "email", "phone", "skills", "experience", "education"];
        const missing = required.filter((k) => json[k] === undefined);
        if (missing.length > 0) {
            console.error("FAIL: Structured JSON is missing fields:", missing);
            process.exit(4);
        }
        else {
            console.log("PASS: Structured JSON contains required fields.");
        }
        console.log("Extracted name:", json.name);
        console.log("Extracted email:", json.email);
        console.log("Extracted phone:", json.phone);
        console.log("Self-test completed successfully.");
        process.exit(0);
    }
    catch (e) {
        console.error("Self-test error:", e && e.message ? e.message : e);
        process.exit(1);
    }
}
if (require.main === module) {
    runSelfTest();
}
