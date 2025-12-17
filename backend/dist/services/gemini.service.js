"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWithGemini = analyzeWithGemini;
exports.generateResumeWithGemini = generateResumeWithGemini;
exports.extractSkillsFromJD = extractSkillsFromJD;
exports.calculateCompletenessScore = calculateCompletenessScore;
exports.calculateJDRealismScore = calculateJDRealismScore;
exports.detectKeywordStuffing = detectKeywordStuffing;
const env_1 = require("../utils/env");
const httpError_1 = require("../utils/httpError");
const fetchFn = globalThis.fetch;
function getModel() {
    const configured = (env_1.env.GEMINI_MODEL || "").trim();
    const DEFAULT = "gemini-2.5-flash";
    // Allowed generation-capable models for this project
    const allowedMap = {
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-2.5-pro": "gemini-2.5-pro",
        "gemini-2.0-flash": "gemini-2.0-flash",
        "gemini-2.0-flash-001": "gemini-2.0-flash-001",
        "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
        "gemini-2.0-flash-lite-001": "gemini-2.0-flash-lite-001",
        "gemini-2.0-flash-preview-image-generation": "gemini-2.0-flash-preview-image-generation",
        "gemini-2.5-flash-lite": "gemini-2.5-flash-lite"
    };
    if (!configured)
        return DEFAULT;
    const key = configured.toLowerCase();
    if (allowedMap[key])
        return allowedMap[key];
    return DEFAULT;
}
function stripMarkdownFences(input) {
    return input
        .replace(/^\s*```(?:json)?/gi, "")
        .replace(/```\s*$/g, "")
        .replace(/^\s*```/gm, "")
        .replace(/```/g, "")
        .trim();
}
function tryExtractTextFromGeminiJson(json) {
    try {
        const c0 = json?.candidates?.[0];
        const p0 = c0?.content?.parts?.[0];
        if (typeof p0?.text === "string")
            return p0.text;
    }
    catch { }
    try {
        if (Array.isArray(json?.candidates)) {
            for (const c of json.candidates) {
                if (typeof c?.content?.parts?.[0]?.text === "string")
                    return c.content.parts[0].text;
            }
        }
    }
    catch { }
    try {
        return JSON.stringify(json);
    }
    catch {
        return null;
    }
}
function safeParseJsonFromText(raw) {
    const cleaned = stripMarkdownFences(raw);
    try {
        return JSON.parse(cleaned);
    }
    catch { }
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        }
        catch { }
    }
    const coerced = cleaned
        .replace(/\n/g, " ")
        .replace(/,\s*\}/g, "}")
        .replace(/,\s*\]/g, "]");
    try {
        return JSON.parse(coerced);
    }
    catch { }
    throw new Error("Unable to parse Gemini JSON response");
}
async function callGemini(prompt) {
    if (!env_1.env.GEMINI_API_KEY) {
        throw new httpError_1.HttpError(500, "Missing Gemini API key (GEMINI_API_KEY)");
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
            "x-goog-api-key": String(env_1.env.GEMINI_API_KEY)
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        let detail = null;
        try {
            detail = await res.text();
        }
        catch { }
        throw new httpError_1.HttpError(502, "Gemini API error", detail);
    }
    let json;
    try {
        json = await res.json();
    }
    catch (e) {
        throw new httpError_1.HttpError(502, "Gemini API error", "Invalid JSON response");
    }
    const text = tryExtractTextFromGeminiJson(json);
    if (typeof text !== "string" || !text) {
        throw new httpError_1.HttpError(502, "Gemini API error", "Empty response from model");
    }
    return text;
}
function buildAnalysisPrompt(resume, jdText) {
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
function buildGenerationPrompt(resume, jdText) {
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
async function analyzeWithGemini(resume, jdText) {
    const prompt = buildAnalysisPrompt(resume, jdText);
    const raw = await callGemini(prompt);
    try {
        const parsed = safeParseJsonFromText(raw);
        return parsed;
    }
    catch (e) {
        throw new httpError_1.HttpError(502, "Gemini API error", raw);
    }
}
async function generateResumeWithGemini(resume, jdText) {
    const prompt = buildGenerationPrompt(resume, jdText);
    const raw = await callGemini(prompt);
    try {
        const parsed = safeParseJsonFromText(raw);
        return parsed;
    }
    catch (e) {
        throw new httpError_1.HttpError(502, "Gemini API error", raw);
    }
}
function buildSkillExtractionPrompt(jdText) {
    return [
        "You are an expert recruiter and skills analyst.",
        "Extract the top 10-15 required skills from this job description. Output STRICT JSON only.",
        "Respond with exactly this key: skills (array of skill names).",
        "Do not include markdown or explanations.",
        "JOB_DESCRIPTION:",
        jdText
    ].join("\n");
}
async function extractSkillsFromJD(jdText) {
    const prompt = buildSkillExtractionPrompt(jdText);
    const raw = await callGemini(prompt);
    try {
        const parsed = safeParseJsonFromText(raw);
        return parsed;
    }
    catch (e) {
        return { skills: [] };
    }
}
function buildCompletenessPrompt(resumeText) {
    return [
        "You are a resume quality analyzer.",
        "Evaluate the completeness of this resume on a scale of 0-100.",
        "Output STRICT JSON only.",
        "Respond with exactly this key: score (0-100).",
        "Do not include markdown or explanations.",
        "RESUME:",
        resumeText
    ].join("\n");
}
async function calculateCompletenessScore(resumeText) {
    try {
        const prompt = buildCompletenessPrompt(resumeText);
        const raw = await callGemini(prompt);
        const parsed = safeParseJsonFromText(raw);
        const score = Math.max(0, Math.min(100, parseInt(parsed.score || 50)));
        return score;
    }
    catch (e) {
        return 50; // Default middle score on error
    }
}
function buildJDRealismPrompt(jdText) {
    return [
        "You are a job market analyzer.",
        "Evaluate how realistic this job description is (not a scam, legitimate requirements).",
        "Score 0-100 where 100 is highly realistic and 0 is likely fraudulent.",
        "Output STRICT JSON only.",
        "Respond with exactly this key: score (0-100).",
        "Do not include markdown or explanations.",
        "JOB_DESCRIPTION:",
        jdText
    ].join("\n");
}
async function calculateJDRealismScore(jdText) {
    try {
        const prompt = buildJDRealismPrompt(jdText);
        const raw = await callGemini(prompt);
        const parsed = safeParseJsonFromText(raw);
        const score = Math.max(0, Math.min(100, parseInt(parsed.score || 75)));
        return score;
    }
    catch (e) {
        return 75; // Default on error
    }
}
function buildKeywordStuffingPrompt(resumeText) {
    return [
        "You are a resume quality analyzer.",
        "Detect if this resume contains keyword stuffing (excessive repetition of keywords to game ATS).",
        "Output STRICT JSON only.",
        "Respond with exactly this key: hasStuffing (boolean).",
        "Do not include markdown or explanations.",
        "RESUME:",
        resumeText
    ].join("\n");
}
async function detectKeywordStuffing(resumeText) {
    try {
        const prompt = buildKeywordStuffingPrompt(resumeText);
        const raw = await callGemini(prompt);
        const parsed = safeParseJsonFromText(raw);
        return parsed.hasStuffing === true;
    }
    catch (e) {
        return false;
    }
}
