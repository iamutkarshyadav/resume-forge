export type ResumeJSON = {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: Array<{ company?: string; title?: string; start?: string; end?: string; description?: string }>;
  projects: Array<{ name?: string; description?: string; tech?: string[] }>;
  education: Array<{ institution?: string; degree?: string; start?: string; end?: string; gpa?: string }>;
};

function extractEmail(text: string) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : "";
}

function extractPhone(text: string) {
  const m = text.match(/(\+?\d[\d\s().-]{6,}\d)/);
  return m ? m[0] : "";
}

function extractName(lines: string[]): string {
  // Use first non-empty line that is not an email/phone and not a section header
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (/email|e-mail|phone|contact|curriculum vitae|resume/i.test(l)) continue;
    if (/education|experience|projects|skills|summary|objective/i.test(l)) continue;
    if (l.length > 3 && l.length < 80) return l.replace(/[^\p{L} .'-]/gu, "");
  }
  return "";
}

function sectionIndices(lines: string[]) {
  const indices: Record<string, number> = {};
  const sections = ["summary", "skills", "experience", "work experience", "projects", "education"];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim().toLowerCase();
    for (const s of sections) {
      if (l === s || l.startsWith(s + ":")) {
        indices[s] = i;
      }
    }
  }
  return indices;
}

function sliceSection(lines: string[], start: number, end?: number) {
  return lines.slice(start + 1, end).join("\n").trim();
}

function parseSkills(block: string) {
  const text = block.replace(/\n/g, ", ");
  const parts = text.split(/[,•\u2022\-|]\s*/).map((s) => s.trim()).filter(Boolean);
  // Deduplicate and normalize
  const set = new Set(parts.map((s) => s.replace(/\s{2,}/g, " ")));
  return Array.from(set);
}

function parseExperience(block: string) {
  const entries: ResumeJSON["experience"] = [];
  const chunks = block.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const header = lines[0];
    const dateMatch = header.match(/(\b\w+\s+\d{4})\s*[-–]\s*(present|\b\w+\s+\d{4})/i) || chunk.match(/(\b\w+\s+\d{4})\s*[-–]\s*(present|\b\w+\s+\d{4})/i);
    const companyTitle = header.replace(/\s*[-–]\s*(\b\w+\s+\d{4}).*$/i, "");
    const [title, company] = companyTitle.includes(" at ") ? companyTitle.split(/\s+at\s+/i) : [companyTitle, undefined];

    const description = lines.slice(1).join("\n").trim();
    entries.push({
      company,
      title,
      start: dateMatch ? dateMatch[1] : undefined,
      end: dateMatch ? dateMatch[2] : undefined,
      description
    });
  }
  return entries;
}

function parseProjects(block: string) {
  const entries: ResumeJSON["projects"] = [];
  const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^[-•\u2022]?\s*([^:]+):\s*(.+)$/);
    if (m) {
      const name = m[1].trim();
      const rest = m[2].trim();
      const tech = rest.match(/\b(react|vue|angular|node|express|prisma|aws|gcp|docker|kubernetes|typescript|python|java|go)\b/gi) || [];
      entries.push({ name, description: rest, tech: tech.map((t) => t.toLowerCase()) });
    } else {
      entries.push({ name: line, description: undefined });
    }
  }
  return entries;
}

function parseEducation(block: string) {
  const entries: ResumeJSON["education"] = [];
  const chunks = block.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const header = lines[0] || "";
    const degreeMatch = chunk.match(/(B\.?Sc\.?|M\.?Sc\.?|B\.Tech|M\.Tech|Bachelor|Master|PhD|Doctor).{0,40}/i);
    const gpaMatch = chunk.match(/GPA\s*[:\-]?\s*([0-9]\.?[0-9]{0,2}\/\s*[0-9]\.?[0-9]{0,2}|[0-4]\.?[0-9]{0,2})/i);
    entries.push({
      institution: header,
      degree: degreeMatch ? degreeMatch[0] : undefined,
      gpa: gpaMatch ? gpaMatch[1] : undefined
    });
  }
  return entries;
}

export function toStructuredJSON(text: string): ResumeJSON {
  const lines = text.split(/\r?\n/);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const name = extractName(lines);
  const idx = sectionIndices(lines);

  const order = ["summary", "skills", "experience", "work experience", "projects", "education"] as const;
  const sections: Record<string, string> = {};
  for (let i = 0; i < order.length; i++) {
    const key = order[i];
    if (idx[key] != null) {
      const start = idx[key]!;
      let end: number | undefined = undefined;
      for (let j = i + 1; j < order.length; j++) {
        if (idx[order[j]] != null) { end = idx[order[j]]!; break; }
      }
      sections[key] = sliceSection(lines, start, end);
    }
  }

  const summary = (sections["summary"] || "").trim() ||
    lines.slice(0, Math.min(10, lines.length)).join(" ").slice(0, 500);

  const skills = parseSkills((sections["skills"] || "").trim());
  const experienceBlock = (sections["experience"] || sections["work experience"] || "").trim();
  const experience = parseExperience(experienceBlock);
  const projects = parseProjects((sections["projects"] || "").trim());
  const education = parseEducation((sections["education"] || "").trim());

  return { name, email, phone, summary, skills, experience, projects, education };
}
