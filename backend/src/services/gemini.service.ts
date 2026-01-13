import { env } from "../utils/env";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";
import { z } from "zod";

const fetchFn: (input: any, init?: any) => Promise<any> = (globalThis as any).fetch;

// Zod schemas for AI response validation
const AnalysisResponseSchema = z.object({
  score: z.number().min(0).max(100).optional().default(0),
  summary: z.string().optional().default(""),
  strengths: z.array(z.string()).optional().default([]),
  weaknesses: z.array(z.string()).optional().default([]),
  missingSkills: z.array(z.string()).optional().default([]),
  recommendations: z.array(z.string()).optional().default([]),
  completenessScore: z.number().min(0).max(100).optional(),
  jdRealismScore: z.number().min(0).max(100).optional(),
  hasKeywordStuffing: z.boolean().optional().default(false),
});

const ResumeGenerationResponseSchema = z.object({
  name: z.coerce.string().optional().default(""),
  email: z.coerce.string().email().optional().default(""),
  phone: z.coerce.string().optional().default(""),
  location: z.coerce.string().optional(),
  title: z.coerce.string().optional(),
  summary: z.coerce.string().optional().default(""),
  links: z.object({
    linkedin: z.coerce.string().optional(),
    github: z.coerce.string().optional(),
    portfolio: z.coerce.string().optional(),
  }).optional(),
  skills: z.union([
    z.array(z.coerce.string()),
    z.array(z.object({
      category: z.coerce.string(),
      items: z.array(z.coerce.string()),
    })),
  ]).optional().default([]),
  experience: z.array(z.object({
    company: z.coerce.string().optional(),
    role: z.coerce.string().optional(),
    title: z.coerce.string().optional(),
    startDate: z.coerce.string().optional(),
    start: z.coerce.string().optional(),
    endDate: z.coerce.string().optional(),
    end: z.coerce.string().optional(),
    location: z.coerce.string().optional(),
    description: z.coerce.string().optional(),
    bullets: z.array(z.coerce.string()).optional(),
  })).optional().default([]),
  projects: z.array(z.object({
    name: z.coerce.string().optional(),
    description: z.coerce.string().optional(),
    tech: z.array(z.coerce.string()).optional(),
    bullets: z.array(z.coerce.string()).optional(),
  })).optional().default([]),
  education: z.array(z.object({
    institution: z.coerce.string().optional(),
    degree: z.coerce.string().optional(),
    field: z.coerce.string().optional(),
    startYear: z.coerce.string().optional(),
    start: z.coerce.string().optional(),
    endYear: z.coerce.string().optional(),
    end: z.coerce.string().optional(),
    gpa: z.coerce.string().optional(),
  })).optional().default([]),
});

const SkillsExtractionResponseSchema = z.object({
  skills: z.array(z.string()).optional().default([]),
});

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

async function callGemini(prompt: string, timeoutMs: number = 120000): Promise<any> {
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

  let lastError: any = null;
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
      });

      // Race between fetch and timeout
      const res = await Promise.race([
        fetchFn(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": String(env.GEMINI_API_KEY)
          },
          body: JSON.stringify(body)
        }),
        timeoutPromise
      ]) as Response;

      if (res.status === 503 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        logger.warn(`Gemini API unavailable, retrying in ${delay.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!res.ok) {
        let detail: any = null;
        try {
          detail = await res.text();
        } catch {}
        lastError = new HttpError(res.status, "Gemini API error", detail);
        logger.error("Gemini API Error", { status: res.status, detail });
        continue;
      }

      let json: any;
      try {
        json = await res.json();
      } catch (e: any) {
        lastError = new HttpError(502, "Gemini API error", "Invalid JSON response");
        continue;
      }

      const text = tryExtractTextFromGeminiJson(json);
      if (typeof text !== "string" || !text) {
        lastError = new HttpError(502, "Gemini API error", "Empty response from model");
        continue;
      }
      return text;
    } catch (error: any) {
      if (error.message === "Request timeout") {
        lastError = new HttpError(504, "AI request timeout - please try again");
        logger.error("Gemini API timeout", { attempt: i + 1 });
        continue;
      }
      lastError = error;
    }
  }
  if (lastError?.status === 503) {
    throw new HttpError(503, "Service Unavailable");
  }

  throw lastError || new HttpError(500, "Failed to call Gemini API");
}

function buildComprehensiveAnalysisPrompt(resume: { fullText: string; jsonData: any }, jdText: string) {
  const resumeJson = JSON.stringify(resume.jsonData || {}, null, 2);
  return [
    "You are an expert Applicant Tracking System (ATS) and resume analyzer.",
    "Analyze the RESUME and JOB DESCRIPTION and output STRICT JSON only.",
    "Respond with exactly these keys:",
    "- score (0-100 match score)",
    "- summary (a concise summary of the match)",
    "- strengths (array of strings)",
    "- weaknesses (array of strings)",
    "- missingSkills (array of strings)",
    "- recommendations (array of strings)",
    "- completenessScore (0-100 score of resume completeness)",
    "- jdRealismScore (0-100 score of job description realism)",
    "- hasKeywordStuffing (boolean)",
    "Do not include markdown or explanations.",
    "RESUME_TEXT:",
    resume.fullText,
    "RESUME_JSON:",
    resumeJson,
    "JOB_DESCRIPTION:",
    jdText
  ].join("\n");
}

export async function analyzeResumeAndJD(
  resume: { fullText: string; jsonData: any },
  jdText: string
) {
  const prompt = buildComprehensiveAnalysisPrompt(resume, jdText);
  let raw: string;
  try {
    raw = await callGemini(prompt, 120000); // 2 minute timeout
  } catch (error: any) {
    logger.error("Gemini API call failed in analyzeResumeAndJD", { error: error.message, status: error.status });
    throw error;
  }

  let parsed: any;
  try {
    parsed = safeParseJsonFromText(raw);
  } catch (e: any) {
    logger.error("Failed to parse Gemini analysis response", { error: e, raw: raw?.substring(0, 500) });
    throw new HttpError(502, "Gemini API error: Could not parse analysis response", raw?.substring(0, 500));
  }

  // Validate with Zod schema
  try {
    const validated = AnalysisResponseSchema.parse(parsed);
    logger.info("Analysis response validated successfully");
    return validated;
  } catch (validationError: any) {
    logger.error("Analysis response validation failed", { 
      error: validationError.errors, 
      received: parsed 
    });
    // Return sanitized version with defaults
    return AnalysisResponseSchema.parse({});
  }
}

function buildGenerationPrompt(resume: { fullText: string; jsonData: any }, jdText: string) {
  const resumeJson = JSON.stringify(resume.jsonData || {}, null, 2);
  const sampleSchema = {
    name: "John Doe",
    email: "john@example.com",
    phone: "123-456-7890",
    location: "San Francisco, CA",
    title: "Senior Software Engineer",
    summary: "Experienced developer...",
    links: { linkedin: "...", github: "...", portfolio: "..." },
    skills: ["React", "Node.js", "TypeScript"], 
    experience: [
      {
        company: "Tech Co",
        role: "Senior Developer",
        title: "Senior Developer",
        start: "2020",
        end: "Present",
        location: "Remote",
        description: "Led team of 5...",
        bullets: ["Achieved X", "Built Y"]
      }
    ],
    projects: [
      {
        name: "Project Alpha",
        description: "A cool app",
        tech: ["Python", "AWS"],
        bullets: ["Developed logic...", "Deployed to lambda..."]
      }
    ],
    education: [
      {
        institution: "University of Tech",
        degree: "BS",
        field: "Computer Science",
        start: "2016",
        end: "2020",
        gpa: "3.8"
      }
    ]
  };

  return [
    "You are a senior resume writer and career coach.",
    "Rewrite the RESUME to best match the JOB DESCRIPTION.",
    "Goal: Tailor the resume content (summary, experience bullets, skills) to include keywords and requirements from the JD.",
    "Output STRICT JSON only.",
    "Use the following structure exactly:",
    JSON.stringify(sampleSchema, null, 2),
    "Do not include markdown fences (```json ... ```) or any preamble.",
    "RESUME_TEXT:",
    resume.fullText,
    "RESUME_JSON:",
    resumeJson,
    "JOB_DESCRIPTION:",
    jdText
  ].join("\n");
}



export async function generateResumeWithGemini(
  resume: { fullText: string; jsonData: any },
  jdText: string
) {
  const prompt = buildGenerationPrompt(resume, jdText);
  let raw: string;
  try {
    raw = await callGemini(prompt, 180000); // 3 minute timeout for generation
  } catch (error: any) {
    logger.error("Gemini API call failed in generateResumeWithGemini", { error: error.message, status: error.status });
    throw error;
  }

  let parsed: any;
  try {
    parsed = safeParseJsonFromText(raw);
  } catch (e: any) {
    logger.error("Failed to parse Gemini generation response", { error: e, raw: raw?.substring(0, 500) });
    throw new HttpError(502, "Gemini API error: Could not parse generation response", raw?.substring(0, 500));
  }

  // Validate with Zod schema
  try {
    const validated = ResumeGenerationResponseSchema.parse(parsed);
    logger.info("Resume generation response validated successfully");
    return validated;
  } catch (validationError: any) {
    logger.error("Resume generation response validation failed", { 
      error: validationError.errors, 
      received: parsed 
    });
    // Try to salvage what we can, but throw error to prevent bad data
    throw new HttpError(502, "AI generated invalid resume data. Please try again.", {
      validationErrors: validationError.errors,
      receivedData: parsed
    });
  }
}

function buildSkillExtractionPrompt(jdText: string) {
  return [
    "You are an expert recruiter and skills analyst.",
    "Extract the top 10-15 required skills from this job description. Output STRICT JSON only.",
    "Respond with exactly this key: skills (array of skill names).",
    "Do not include markdown or explanations.",
    "JOB_DESCRIPTION:",
    jdText
  ].join("\n");
}

export async function extractSkillsFromJD(jdText: string) {
  const prompt = buildSkillExtractionPrompt(jdText);
  let raw: string;
  try {
    raw = await callGemini(prompt, 60000); // 1 minute timeout
  } catch (error: any) {
    logger.warn("Gemini API call failed in extractSkillsFromJD", { error: error.message });
    return { skills: [] };
  }

  let parsed: any;
  try {
    parsed = safeParseJsonFromText(raw);
  } catch (e: any) {
    logger.warn("Failed to parse skills extraction response", { error: e });
    return { skills: [] };
  }

  // Validate with Zod schema - be lenient for skills extraction
  try {
    const validated = SkillsExtractionResponseSchema.parse(parsed);
    return validated;
  } catch (validationError: any) {
    logger.warn("Skills extraction response validation failed, returning empty", { 
      error: validationError.errors 
    });
    return { skills: [] };
  }
}


