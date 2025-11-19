import { env } from "../utils/env";
import { HttpError } from "../utils/httpError";

const fetchFn: (input: any, init?: any) => Promise<any> = (globalThis as any).fetch;

function getModel(): string {
  const configured = (env.GEMINI_MODEL || "").trim();
  const DEFAULT = "gemini-2.5-flash";

  // Allowed generation-capable models for this project
  const allowedMap: Record<string, string> = {
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-001": "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001": "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash-preview-image-generation": "gemini-2.0-flash-preview-image-generation",
    "gemini-2.5-flash-lite": "gemini-2.5-flash-lite"
  };

  if (!configured) return DEFAULT;
  const key = configured.toLowerCase();
  if (allowedMap[key]) return allowedMap[key];
  return DEFAULT;
}

function stripMarkdownFences(input: string): string {
  return input
    .replace(/^\s*```(?:json)?/gi, "")
    .replace(/```\s*$/g, "")
    .replace(/^\s*```/gm, "")
    .replace(/```/g, "")
    .trim();
}

function tryExtractTextFromGeminiJson(json: any): string | null {
  try {
    const c0 = json?.candidates?.[0];
    const p0 = c0?.content?.parts?.[0];
    if (typeof p0?.text === "string") return p0.text as string;
  } catch {}

  try {
    if (Array.isArray(json?.candidates)) {
      for (const c of json.candidates) {
        if (typeof c?.content?.parts?.[0]?.text === "string") return c.content.parts[0].text as string;
      }
    }
  } catch {}

  try {
    return JSON.stringify(json);
  } catch {
    return null;
  }
}

function safeParseJsonFromText(raw: string): any {
  const cleaned = stripMarkdownFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  const coerced = cleaned
    .replace(/\n/g, " ")
    .replace(/,\s*\}/g, "}")
    .replace(/,\s*\]/g, "]");
  try {
    return JSON.parse(coerced);
  } catch {}
  throw new Error("Unable to parse Gemini JSON response");
}

async function callGemini(prompt: string): Promise<any> {
  if (!env.GEMINI_API_KEY) {
    throw new HttpError(500, "Missing Gemini API key (GEMINI_API_KEY)");
  }

  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": String(env.GEMINI_API_KEY)
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.text();
    } catch {}
    throw new HttpError(502, "Gemini API error", detail);
  }

  let json: any;
  try {
    json = await res.json();
  } catch (e: any) {
    throw new HttpError(502, "Gemini API error", "Invalid JSON response");
  }

  const text = tryExtractTextFromGeminiJson(json);
  if (typeof text !== "string" || !text) {
    throw new HttpError(502, "Gemini API error", "Empty response from model");
  }
  return text;
}

function buildAnalysisPrompt(resume: { fullText: string; jsonData: any }, jdText: string) {
  const resumeJson = JSON.stringify(resume.jsonData || {}, null, 2);
  return [
    "You are an Applicant Tracking System (ATS) resume analyzer.",
    "Compare the RESUME and JOB DESCRIPTION and output STRICT JSON only.",
    "Respond with exactly these keys:",
    "score (0-100), summary, strengths (array), weaknesses (array), missingSkills (array), recommendations (array).",
    "Do not include markdown or explanations.",
    "RESUME_TEXT:",
    resume.fullText,
    "RESUME_JSON:",
    resumeJson,
    "JOB_DESCRIPTION:",
    jdText
  ].join("\n");
}

function buildGenerationPrompt(resume: { fullText: string; jsonData: any }, jdText: string) {
  const resumeJson = JSON.stringify(resume.jsonData || {}, null, 2);
  return [
    "You are a senior resume writer.",
    "Rewrite the resume to best match the JOB DESCRIPTION and output STRICT JSON only.",
    "Respond with exactly these keys: name, email, phone, summary, skills (array), experience (array), projects (array), education (array).",
    "Do not include markdown or explanations.",
    "RESUME_TEXT:",
    resume.fullText,
    "RESUME_JSON:",
    resumeJson,
    "JOB_DESCRIPTION:",
    jdText
  ].join("\n");
}

export async function analyzeWithGemini(
  resume: { fullText: string; jsonData: any },
  jdText: string
) {
  const prompt = buildAnalysisPrompt(resume, jdText);
  const raw = await callGemini(prompt);
  try {
    const parsed = safeParseJsonFromText(raw);
    return parsed;
  } catch (e: any) {
    throw new HttpError(502, "Gemini API error", raw);
  }
}

export async function generateResumeWithGemini(
  resume: { fullText: string; jsonData: any },
  jdText: string
) {
  const prompt = buildGenerationPrompt(resume, jdText);
  const raw = await callGemini(prompt);
  try {
    const parsed = safeParseJsonFromText(raw);
    return parsed;
  } catch (e: any) {
    throw new HttpError(502, "Gemini API error", raw);
  }
}
