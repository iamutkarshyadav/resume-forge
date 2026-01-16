"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJDFile = parseJDFile;
exports.saveJobDescription = saveJobDescription;
const fs_1 = __importDefault(require("fs"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const parser_mock_1 = require("../utils/parser.mock");
async function parseJDFile(file) {
    const buffer = await fs_1.default.promises.readFile(file.path);
    // Reuse parser to extract text from the job description file
    const parsed = await (0, parser_mock_1.mockParseResume)(buffer, file.originalname);
    return parsed.text;
}
async function saveJobDescription(userId, fullText) {
    const jd = await prismaClient_1.default.jobDescription.create({
        data: {
            userId,
            title: "Untitled Job", // Required field
            fullText
        }
    });
    return jd;
}
