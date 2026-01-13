"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStructuredJSON = toStructuredJSON;
function extractEmail(text) {
    const m = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    return m ? m[0] : "";
}
function extractPhone(text) {
    // More robust phone regex allowing common formats like (123) 456-7890, +1 123 456 7890
    const m = text.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/);
    return m ? m[0] : "";
}
function extractName(lines) {
    // Strategy: The name is usually in the first 5 lines.
    // It is typically short (2-4 words), mostly capitalized, and NOT a common header.
    const commonHeaders = new Set([
        "resume", "curriculum vitae", "cv", "email", "phone", "mobile", "address",
        "summary", "objective", "skills", "experience", "education", "projects", "contact"
    ]);
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const lower = line.toLowerCase();
        // Skip if it contains email or phone indicators
        if (lower.includes("@") || /\d{3}/.test(lower))
            continue;
        // Skip if it matches a common header exactly
        if (commonHeaders.has(lower.replace(/[:.]/g, "")))
            continue;
        // Heuristic: Name usually has no special chars (except maybe - or ')
        // and is between 3 and 50 chars.
        if (line.length > 2 && line.length < 50 && /^[a-zA-Z\s\-.']+$/.test(line)) {
            // Double check: mostly uppercase or Title Case?
            // If it looks like a sentence (many lowercase words), skip.
            const words = line.split(/\s+/);
            if (words.length > 4)
                continue; // Names rarely have > 4 parts
            return line;
        }
    }
    return "";
}
function sectionIndices(lines) {
    const indices = {};
    const sections = ["summary", "skills", "experience", "work experience", "professional experience", "projects", "education", "certifications"];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        // Exact match or "Section:" format
        if (sections.includes(line.replace(/[:]/g, ""))) {
            // Map variations to standard keys
            let key = line.replace(/[:]/g, "");
            if (key.includes("work") || key.includes("professional"))
                key = "experience";
            indices[key] = i;
        }
    }
    return indices;
}
function sliceSection(lines, start, end) {
    return lines.slice(start + 1, end).join("\n").trim();
}
function parseSkills(block) {
    if (!block)
        return [];
    // Split by common delimiters
    const text = block.replace(/\n/g, ", ");
    const parts = text.split(/[,•\u2022\-|;]\s*/).map((s) => s.trim()).filter(Boolean);
    // Filter out noise (too long strings are likely not skills)
    const skills = parts.filter(s => s.length < 40 && s.length > 1);
    return Array.from(new Set(skills));
}
function parseExperience(block) {
    const entries = [];
    if (!block)
        return entries;
    // Split by double newlines or lines that look like headers (Date ranges)
    const dateRegex = /(\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?: |\.)?\d{4}|\b\d{4})\s*[-–to]+\s*(\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?: |\.)?\d{4}|\b\d{4}|Present|Current)/i;
    const chunks = block.split(/\n\s*\n/);
    for (const chunk of chunks) {
        const lines = chunk.split(/\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0)
            continue;
        // Try to find date in first 2 lines
        let dateLine = "";
        let companyLine = "";
        let roleLine = "";
        const l0 = lines[0];
        const l1 = lines[1] || "";
        if (dateRegex.test(l0)) {
            dateLine = l0;
            companyLine = l1;
        }
        else if (dateRegex.test(l1)) {
            companyLine = l0;
            dateLine = l1;
        }
        else {
            // Fallback
            companyLine = l0;
        }
        const dateMatch = dateLine.match(dateRegex);
        let start, end;
        if (dateMatch) {
            // Clean up date string extraction
            const range = dateMatch[0];
            const parts = range.split(/[-–to]+/);
            start = parts[0]?.trim();
            end = parts[1]?.trim();
        }
        entries.push({
            company: companyLine.replace(dateRegex, "").trim(), // Remove date if present in same line
            title: roleLine, // Hard to extract title deterministically without AI
            start,
            end,
            description: lines.slice(2).join("\n")
        });
    }
    return entries;
}
function parseProjects(block) {
    const entries = [];
    if (!block)
        return entries;
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
        // Project Name: Description
        const m = line.match(/^[-•\u2022]?\s*([^:]+):\s*(.+)$/);
        if (m) {
            const name = m[1].trim();
            const rest = m[2].trim();
            const tech = rest.match(/\b(react|vue|angular|node|express|prisma|aws|gcp|docker|kubernetes|typescript|python|java|go|sql|mongo)\b/gi) || [];
            entries.push({ name, description: rest, tech: tech.map((t) => t.toLowerCase()) });
        }
        else {
            // Heuristic: Short line is title, long line is desc? Too risky.
            // Just add as name for now.
            if (line.length < 50) {
                entries.push({ name: line, description: "" });
            }
            else {
                // Attach to previous project if exists
                if (entries.length > 0) {
                    entries[entries.length - 1].description += " " + line;
                }
            }
        }
    }
    return entries;
}
function parseEducation(block) {
    const entries = [];
    if (!block)
        return entries;
    const chunks = block.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
    for (const chunk of chunks) {
        const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const header = lines[0] || "";
        const degreeMatch = chunk.match(/(B\.?(?:S|A)\.?|M\.?(?:S|A)\.?|Ph\.?D\.?|Bachelor|Master|Doctor|Diploma|Certificate)[^,\n]*/i);
        const gpaMatch = chunk.match(/GPA\s*[:\-]?\s*([0-4]\.\d{1,2})/i);
        entries.push({
            institution: header,
            degree: degreeMatch ? degreeMatch[0].trim() : undefined,
            gpa: gpaMatch ? gpaMatch[1] : undefined
        });
    }
    return entries;
}
function toStructuredJSON(text) {
    const lines = text.split(/\r?\n/);
    const email = extractEmail(text);
    const phone = extractPhone(text);
    const name = extractName(lines);
    const idx = sectionIndices(lines);
    const sections = {};
    const orderedKeys = Object.keys(idx).sort((a, b) => idx[a] - idx[b]);
    for (let i = 0; i < orderedKeys.length; i++) {
        const key = orderedKeys[i];
        const start = idx[key];
        const endKey = orderedKeys[i + 1];
        const end = endKey ? idx[endKey] : undefined;
        sections[key] = sliceSection(lines, start, end);
    }
    const summary = (sections["summary"] || "").trim() ||
        lines.slice(0, Math.min(10, lines.length)).join(" ").slice(0, 500);
    const skills = parseSkills(sections["skills"] || "");
    const experience = parseExperience(sections["experience"] || "");
    const projects = parseProjects(sections["projects"] || "");
    const education = parseEducation(sections["education"] || "");
    return { name, email, phone, summary, skills, experience, projects, education };
}
