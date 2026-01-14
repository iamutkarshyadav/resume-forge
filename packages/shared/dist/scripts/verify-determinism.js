"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const renderer_1 = require("@react-pdf/renderer");
const ResumeDocument_1 = require("../src/components/ResumeDocument");
const layout_resolver_1 = require("../src/layout-resolver");
const mapper_1 = require("../src/mapper");
const ast_1 = require("../src/ast");
const crypto = __importStar(require("crypto"));
// Mock Data
const MOCK_DATA = {
    name: "John Doe",
    email: "john@example.com",
    phone: "123-456-7890",
    summary: "Experienced software engineer...",
    skills: ["React", "TypeScript", "Node.js"],
    experience: [
        {
            company: "Tech Corp",
            role: "Senior Engineer",
            start: "2020",
            end: "Present",
            description: "Building cool stuff",
            bullets: ["Led team of 5", "Improved perf by 50%"]
        }
    ],
    education: [],
    projects: []
};
async function generateHash() {
    const ast = (0, mapper_1.mapToAST)(MOCK_DATA, ast_1.DEFAULT_TEMPLATE_RULES);
    const layout = (0, layout_resolver_1.resolveLayout)(ast, ast_1.DEFAULT_TEMPLATE_RULES);
    const stream = await (0, renderer_1.renderToStream)((0, react_1.createElement)(ResumeDocument_1.ResumeDocument, { layout }));
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}
async function run() {
    console.log("Running Determinism Test...");
    console.log("Run 1...");
    const hash1 = await generateHash();
    console.log("Hash 1:", hash1);
    console.log("Run 2...");
    const hash2 = await generateHash();
    console.log("Hash 2:", hash2);
    if (hash1 === hash2) {
        console.log("✅ SUCCESS: Hashes match. Output is deterministic.");
        process.exit(0);
    }
    else {
        console.error("❌ FAILURE: Hashes do not match.");
        process.exit(1);
    }
}
run();
