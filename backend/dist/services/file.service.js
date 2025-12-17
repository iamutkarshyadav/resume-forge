"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndSaveResume = parseAndSaveResume;
const fs_1 = __importDefault(require("fs"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const path_1 = __importDefault(require("path"));
const pdfParser_1 = require("../utils/pdfParser");
const resume_parser_1 = require("../utils/resume.parser");
const parser_mock_1 = require("../utils/parser.mock");
async function parseAndSaveResume(file, userId) {
    const buffer = await fs_1.default.promises.readFile(file.path);
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    let text = "";
    try {
        if (ext === ".pdf") {
            try {
                const pdfText = await (0, pdfParser_1.extractPdfText)(buffer);
                text = (pdfText || "").trim();
            }
            catch (innerErr) {
                const msg = String(innerErr?.message || "");
                if (msg === "PDF is not text-based" || innerErr?.code === "SCANNED_PDF") {
                    const err = new Error("PDF is not text-based");
                    err.status = 400;
                    throw err;
                }
                throw innerErr;
            }
        }
        else if (ext === ".docx") {
            const parsed = await (0, parser_mock_1.mockParseResume)(buffer, file.originalname);
            text = (parsed.text || "").trim();
            if (!text) {
                const err = new Error("Unable to extract text from DOCX. Please upload a valid document.");
                err.status = 400;
                throw err;
            }
        }
        else if (ext === ".txt" || ext === ".md") {
            text = buffer.toString("utf8");
        }
        else {
            text = buffer.toString("utf8");
        }
    }
    catch (e) {
        if (e?.status)
            throw e;
        const err = new Error("Failed to process uploaded file");
        err.status = 500;
        err.details = e?.message || String(e);
        throw err;
    }
    text = (text || "").replace(/\u0000/g, "").trim();
    // Validation: ensure we did not accidentally store raw PDF binary
    const binaryPdfRegex = /%PDF-/;
    if (binaryPdfRegex.test(text) || text.indexOf("%PDF") !== -1) {
        const err = new Error("Uploaded resume appears to contain raw PDF binary data. Ensure the file is a readable PDF or text document.");
        err.status = 400;
        throw err;
    }
    const jsonStructured = (0, resume_parser_1.toStructuredJSON)(text || "");
    const jsonData = { ...jsonStructured, path: file.path };
    const resume = await prismaClient_1.default.resume.create({
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
