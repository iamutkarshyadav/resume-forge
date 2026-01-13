import puppeteer, { Browser } from "puppeteer";
import { promises as fsPromises } from "fs";
import path from "path";
import os from "os";

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location?: string;
  title?: string;
  summary: string;
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  skills: string[] | { category: string; items: string[] }[];
  experience: Array<{
    company?: string;
    role?: string;
    title?: string;
    startDate?: string;
    start?: string;
    endDate?: string;
    end?: string;
    location?: string;
    description?: string;
    bullets?: string[];
  }>;
  projects: Array<{
    name?: string;
    description?: string;
    tech?: string[];
    bullets?: string[];
  }>;
  education: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startYear?: string;
    start?: string;
    endYear?: string;
    end?: string;
    gpa?: string;
  }>;
}

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  try {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    return browserInstance;
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error";
    console.error("Error launching browser:", errorMessage);
    throw new Error(`Failed to initialize PDF generator: ${errorMessage}`);
  }
}

function generateResumeHTML(data: ResumeData): string {
  // Normalize dates
  const normalizeDate = (start?: string, end?: string) => {
    const s = (start || "").trim();
    const e = (end || "").trim();
    if (!s && !e) return "";
    if (s && e) return `${s} – ${e}`;
    if (s) return s;
    return e;
  };

  // Process skills
  const skillsData = Array.isArray(data.skills)
    ? data.skills[0] && typeof data.skills[0] === "object" && "category" in data.skills[0]
      ? (data.skills as { category: string; items: string[] }[])
      : [{ category: "Skills", items: data.skills as string[] }]
    : [];

  // Filter out empty entries
  const hasExperience =
    data.experience &&
    data.experience.length > 0 &&
    data.experience.some((e) => e.company || e.role || e.title);
  const hasProjects =
    data.projects && data.projects.length > 0 && data.projects.some((p) => p.name);
  const hasEducation =
    data.education &&
    data.education.length > 0 &&
    data.education.some((e) => e.institution || e.degree);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - ${data.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 10.5pt;
      line-height: 1.4;
      color: #000;
      background: white;
    }

    .resume-container {
      width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.5in;
      display: flex;
      flex-direction: column;
      gap: 0.15in;
    }

    /* Header Section */
    .header {
      text-align: center;
      margin-bottom: 0.2in;
    }

    .header h1 {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 0.05in;
      margin-top: 0;
    }

    .header .contact-info {
      font-size: 9pt;
      color: #333;
      display: flex;
      justify-content: center;
      gap: 0.3in;
      flex-wrap: wrap;
    }

    .contact-info span {
      display: inline-block;
    }

    /* Section Styles */
    .section {
      margin-bottom: 0.15in;
    }

    .section-title {
      font-size: 11pt;
      font-weight: bold;
      border-bottom: 1pt solid #000;
      padding-bottom: 0.05in;
      margin-bottom: 0.1in;
    }

    /* Summary Section */
    .summary-text {
      font-size: 10pt;
      line-height: 1.5;
      text-align: justify;
      margin-bottom: 0.1in;
    }

    /* Experience */
    .experience-item {
      margin-bottom: 0.12in;
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 10.5pt;
      margin-bottom: 0.02in;
    }

    .job-title {
      font-weight: bold;
    }

    .job-company {
      font-weight: normal;
      font-style: italic;
    }

    .job-meta {
      font-size: 9pt;
      color: #333;
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.05in;
    }

    .job-bullets {
      margin-left: 0.2in;
      margin-bottom: 0.05in;
    }

    .job-bullets li {
      font-size: 10pt;
      margin-bottom: 0.02in;
      list-style-type: disc;
    }

    /* Projects */
    .project-item {
      margin-bottom: 0.12in;
    }

    .project-name {
      font-weight: bold;
      font-size: 10.5pt;
      margin-bottom: 0.02in;
    }

    .project-tech {
      font-size: 9pt;
      color: #333;
      font-style: italic;
      margin-bottom: 0.05in;
    }

    .project-bullets {
      margin-left: 0.2in;
      margin-bottom: 0.05in;
    }

    .project-bullets li {
      font-size: 10pt;
      margin-bottom: 0.02in;
      list-style-type: disc;
    }

    /* Skills */
    .skills-category {
      margin-bottom: 0.08in;
    }

    .skills-category-name {
      font-weight: bold;
      font-size: 10pt;
      display: inline;
    }

    .skills-list {
      display: inline;
      font-size: 10pt;
    }

    /* Education */
    .education-item {
      margin-bottom: 0.12in;
    }

    .education-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 10.5pt;
      margin-bottom: 0.02in;
    }

    .education-degree {
      font-weight: bold;
    }

    .education-meta {
      font-size: 9pt;
      color: #333;
    }

    .education-meta span {
      display: inline;
    }

    .education-meta span:not(:last-child)::after {
      content: " • ";
      margin: 0 0.05in;
    }

    /* Links */
    .links {
      font-size: 9pt;
      color: #333;
      margin-bottom: 0.1in;
      display: flex;
      justify-content: center;
      gap: 0.3in;
      flex-wrap: wrap;
    }

    .links a {
      color: #0066cc;
      text-decoration: none;
    }

    .links a:hover {
      text-decoration: underline;
    }

    /* Utilities */
    .page-break {
      page-break-after: always;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .resume-container {
        margin: 0;
        width: 100%;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <!-- Header -->
    <div class="header">
      <h1>${escapeHtml(data.name)}</h1>
      ${
        data.title
          ? `<p style="font-size: 10pt; font-style: italic; margin-bottom: 0.05in;">${escapeHtml(data.title)}</p>`
          : ""
      }
      <div class="contact-info">
        ${data.email ? `<span>${escapeHtml(data.email)}</span>` : ""}
        ${data.phone ? `<span>${escapeHtml(data.phone)}</span>` : ""}
        ${data.location ? `<span>${escapeHtml(data.location)}</span>` : ""}
      </div>
      ${
        data.links &&
        (data.links.linkedin || data.links.github || data.links.portfolio)
          ? `
      <div class="links">
        ${data.links.linkedin ? `<a href="${escapeHtml(data.links.linkedin)}">${escapeHtml(getHostname(data.links.linkedin))}</a>` : ""}
        ${data.links.github ? `<a href="${escapeHtml(data.links.github)}">${escapeHtml(getHostname(data.links.github))}</a>` : ""}
        ${data.links.portfolio ? `<a href="${escapeHtml(data.links.portfolio)}">Portfolio</a>` : ""}
      </div>
      `
          : ""
      }
    </div>

    <!-- Summary -->
    ${
      data.summary
        ? `
    <div class="section">
      <div class="section-title">PROFESSIONAL SUMMARY</div>
      <p class="summary-text">${escapeHtml(data.summary)}</p>
    </div>
    `
        : ""
    }

    <!-- Experience -->
    ${
      hasExperience
        ? `
    <div class="section">
      <div class="section-title">EXPERIENCE</div>
      ${data.experience
        .filter((e) => e.company || e.role || e.title)
        .map(
          (exp) => `
      <div class="experience-item">
        <div class="job-header">
          <span class="job-title">${escapeHtml(exp.role || exp.title || "")}</span>
          <span>${escapeHtml(normalizeDate(exp.start || exp.startDate, exp.end || exp.endDate))}</span>
        </div>
        <div class="job-meta">
          <span>${escapeHtml(exp.company || "")}</span>
          ${exp.location ? `<span>${escapeHtml(exp.location)}</span>` : ""}
        </div>
        ${
          exp.bullets && exp.bullets.length > 0
            ? `
        <ul class="job-bullets">
          ${exp.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
        `
            : exp.description
              ? `<p style="font-size: 10pt; margin-left: 0.2in; margin-bottom: 0.05in;">${escapeHtml(exp.description)}</p>`
              : ""
        }
      </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Projects -->
    ${
      hasProjects
        ? `
    <div class="section">
      <div class="section-title">PROJECTS</div>
      ${data.projects
        .filter((p) => p.name)
        .map(
          (proj) => `
      <div class="project-item">
        <div class="project-name">${escapeHtml(proj.name || "")}</div>
        ${proj.tech && proj.tech.length > 0 ? `<div class="project-tech">${escapeHtml(proj.tech.join(", "))}</div>` : ""}
        ${
          proj.bullets && proj.bullets.length > 0
            ? `
        <ul class="project-bullets">
          ${proj.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
        `
            : proj.description
              ? `<p style="font-size: 10pt; margin-left: 0.2in; margin-bottom: 0.05in;">${escapeHtml(proj.description)}</p>`
              : ""
        }
      </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Skills -->
    ${
      skillsData.length > 0 && skillsData.some((s) => s.items.length > 0)
        ? `
    <div class="section">
      <div class="section-title">SKILLS</div>
      ${skillsData
        .filter((s) => s.items.length > 0)
        .map(
          (skillGroup) => `
      <div class="skills-category">
        <span class="skills-category-name">${escapeHtml(skillGroup.category)}:</span>
        <span class="skills-list">${skillGroup.items.map((skill) => escapeHtml(skill)).join(", ")}</span>
      </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Education -->
    ${
      hasEducation
        ? `
    <div class="section">
      <div class="section-title">EDUCATION</div>
      ${data.education
        .filter((e) => e.institution || e.degree)
        .map(
          (edu) => `
      <div class="education-item">
        <div class="education-header">
          <span class="education-degree">${escapeHtml(edu.degree || "")}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}</span>
          <span>${escapeHtml(normalizeDate(edu.start || edu.startYear, edu.end || edu.endYear))}</span>
        </div>
        <div class="education-meta">
          <span>${escapeHtml(edu.institution || "")}</span>
          ${edu.gpa ? `<span>GPA: ${escapeHtml(edu.gpa)}</span>` : ""}
        </div>
      </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }
  </div>
</body>
</html>
  `;
}

// HTML escaping for Node.js environment
function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Safely extract hostname from URL string
function getHostname(url: string): string {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
    return new URL(urlWithProtocol).hostname;
  } catch {
    // If URL is invalid, return the original string as fallback
    return url;
  }
}

// Normalize resume data: convert arrays to strings for description fields and ensure arrays are valid
function normalizeResumeData(data: ResumeData): ResumeData {
  const normalized = { ...data };

  // Normalize experience descriptions (array → string) and ensure arrays are valid
  if (normalized.experience && Array.isArray(normalized.experience)) {
    normalized.experience = normalized.experience
      .filter(exp => exp && typeof exp === 'object') // Filter out null/undefined
      .map((exp) => {
        const normalizedExp = { ...exp };
        // If description is an array, join it with newlines
        if (Array.isArray(normalizedExp.description)) {
          normalizedExp.description = normalizedExp.description
            .filter(item => item && typeof item === 'string')
            .join("\n");
        }
        // Ensure bullets is an array of strings
        if (Array.isArray(normalizedExp.bullets)) {
          normalizedExp.bullets = normalizedExp.bullets
            .filter(bullet => bullet && typeof bullet === 'string');
        } else if (normalizedExp.bullets && typeof normalizedExp.bullets !== 'object') {
          normalizedExp.bullets = [];
        }
        return normalizedExp;
      });
  } else {
    normalized.experience = [];
  }

  // Normalize project descriptions (array → string) and ensure arrays are valid
  if (normalized.projects && Array.isArray(normalized.projects)) {
    normalized.projects = normalized.projects
      .filter(proj => proj && typeof proj === 'object') // Filter out null/undefined
      .map((proj) => {
        const normalizedProj = { ...proj };
        // If description is an array, join it with newlines
        if (Array.isArray(normalizedProj.description)) {
          normalizedProj.description = normalizedProj.description
            .filter(item => item && typeof item === 'string')
            .join("\n");
        }
        // Ensure bullets and tech are arrays of strings
        if (Array.isArray(normalizedProj.bullets)) {
          normalizedProj.bullets = normalizedProj.bullets
            .filter(bullet => bullet && typeof bullet === 'string');
        } else {
          normalizedProj.bullets = [];
        }
        if (Array.isArray(normalizedProj.tech)) {
          normalizedProj.tech = normalizedProj.tech
            .filter(tech => tech && typeof tech === 'string');
        } else {
          normalizedProj.tech = [];
        }
        return normalizedProj;
      });
  } else {
    normalized.projects = [];
  }

  // Ensure education is an array
  if (!normalized.education || !Array.isArray(normalized.education)) {
    normalized.education = [];
  } else {
    normalized.education = normalized.education.filter(edu => edu && typeof edu === 'object');
  }

  // Ensure skills is an array
  if (!normalized.skills || !Array.isArray(normalized.skills)) {
    normalized.skills = [];
  }

  return normalized;
}

export async function generatePDF(
  resumeData: ResumeData,
  fileName: string
): Promise<Buffer> {
  const browser = await getBrowser();
  let page;

  try {
    // Normalize data before generation (fix array → string issue)
    const normalizedData = normalizeResumeData(resumeData);

    page = await browser.newPage();

    // Set up page with specific dimensions for letter-size paper
    await page.setViewport({ width: 816, height: 1056 });

    // Generate HTML with normalized data
    const html = generateResumeHTML(normalizedData);

    // Set content
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF with timeout and error handling
    const pdfBuffer = await Promise.race([
      page.pdf({
        format: "Letter",
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
        printBackground: true,
        preferCSSPageSize: false, // Use explicit format
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("PDF generation timeout after 30 seconds")), 30000)
      )
    ]);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("PDF generation resulted in empty buffer");
    }

    return pdfBuffer;
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error";
    console.error("Error generating PDF:", errorMessage);
    
    // Provide more specific error messages
    if (errorMessage.includes("timeout")) {
      throw new Error("PDF generation took too long. The resume may be too large. Please try again.");
    }
    if (errorMessage.includes("memory") || errorMessage.includes("out of memory")) {
      throw new Error("PDF generation failed due to memory limits. Please try with a smaller resume.");
    }
    
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.error("Error closing PDF page:", closeError);
      }
    }
  }
}

export async function savePDFToTemp(
  resumeData: ResumeData,
  fileName: string
): Promise<string> {
  try {
    const pdfBuffer = await generatePDF(resumeData, fileName);

    // Create temp file
    const tempDir = os.tmpdir();
    const sanitizedFileName = fileName.replace(/[^a-z0-9._-]/gi, "_");
    const tempPath = path.join(tempDir, `${Date.now()}_${sanitizedFileName}`);

    // Write to temp file
    await fsPromises.writeFile(tempPath, pdfBuffer);

    return tempPath;
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error";
    console.error("Error saving PDF to temp:", errorMessage);
    throw new Error(`Failed to save PDF: ${errorMessage}`);
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
    browserInstance = null;
  }
}
