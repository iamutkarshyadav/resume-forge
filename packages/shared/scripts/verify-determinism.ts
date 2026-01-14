import { createElement } from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ResumeDocument } from "../src/components/ResumeDocument";
import { resolveLayout } from "../src/layout-resolver";
import { mapToAST } from "../src/mapper";
import { DEFAULT_TEMPLATE_RULES } from "../src/ast";
import * as crypto from 'crypto';

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
  const ast = mapToAST(MOCK_DATA, DEFAULT_TEMPLATE_RULES);
  const layout = resolveLayout(ast, DEFAULT_TEMPLATE_RULES);
  
  const stream = await renderToStream(createElement(ResumeDocument, { layout }));
  
  return new Promise<string>((resolve, reject) => {
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
  } else {
    console.error("❌ FAILURE: Hashes do not match.");
    process.exit(1);
  }
}

run();
