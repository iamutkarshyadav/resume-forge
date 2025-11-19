"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndSaveResume = parseAndSaveResume;
const fs_1 = __importDefault(require("fs"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const parser_mock_1 = require("../utils/parser.mock");
async function parseAndSaveResume(file, userId) {
    const buffer = fs_1.default.readFileSync(file.path);
    const parsed = (0, parser_mock_1.mockParseResume)(buffer, file.originalname);
    const resume = await prismaClient_1.default.resume.create({
        data: {
            filename: file.originalname,
            sizeKB: file.size / 1024,
            fullText: parsed.text,
            jsonData: {
                summary: parsed.summary,
                path: file.path,
                mimeType: file.mimetype
            },
            uploadedById: userId
        }
    });
    return { resume, parsed };
}
