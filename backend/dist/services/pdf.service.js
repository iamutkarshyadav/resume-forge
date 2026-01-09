"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = generatePDF;
exports.savePDFToTemp = savePDFToTemp;
exports.closeBrowser = closeBrowser;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
let browserInstance = null;
async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }
    try {
        browserInstance = await puppeteer_1.default.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        });
        return browserInstance;
    }
    catch (error) {
        console.error("Error launching browser:", error);
        throw new Error("Failed to initialize PDF generator");
    }
}
function generateResumeHTML(data) {
    // Normalize dates
    const normalizeDate = (start, end) => {
        const s = (start || "").trim();
        const e = (end || "").trim();
        if (!s && !e)
            return "";
        if (s && e)
            return `${s} – ${e}`;
        if (s)
            return s;
        return e;
    };
    // Process skills
    const skillsData = Array.isArray(data.skills)
        ? data.skills[0] && typeof data.skills[0] === "object" && "category" in data.skills[0]
            ? data.skills
            : [{ category: "Skills", items: data.skills }]
        : [];
    // Filter out empty entries
    const hasExperience = data.experience &&
        data.experience.length > 0 &&
        data.experience.some((e) => e.company || e.role || e.title);
    const hasProjects = data.projects && data.projects.length > 0 && data.projects.some((p) => p.name);
    const hasEducation = data.education &&
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
      ${data.title
        ? `<p style="font-size: 10pt; font-style: italic; margin-bottom: 0.05in;">${escapeHtml(data.title)}</p>`
        : ""}
      <div class="contact-info">
        ${data.email ? `<span>${escapeHtml(data.email)}</span>` : ""}
        ${data.phone ? `<span>${escapeHtml(data.phone)}</span>` : ""}
        ${data.location ? `<span>${escapeHtml(data.location)}</span>` : ""}
      </div>
      ${data.links &&
        (data.links.linkedin || data.links.github || data.links.portfolio)
        ? `
      <div class="links">
        ${data.links.linkedin ? `<a href="${escapeHtml(data.links.linkedin)}">${escapeHtml(new URL(data.links.linkedin).hostname)}</a>` : ""}
        ${data.links.github ? `<a href="${escapeHtml(data.links.github)}">${escapeHtml(new URL(data.links.github).hostname)}</a>` : ""}
        ${data.links.portfolio ? `<a href="${escapeHtml(data.links.portfolio)}">Portfolio</a>` : ""}
      </div>
      `
        : ""}
    </div>

    <!-- Summary -->
    ${data.summary
        ? `
    <div class="section">
      <div class="section-title">PROFESSIONAL SUMMARY</div>
      <p class="summary-text">${escapeHtml(data.summary)}</p>
    </div>
    `
        : ""}

    <!-- Experience -->
    ${hasExperience
        ? `
    <div class="section">
      <div class="section-title">EXPERIENCE</div>
      ${data.experience
            .filter((e) => e.company || e.role || e.title)
            .map((exp) => `
      <div class="experience-item">
        <div class="job-header">
          <span class="job-title">${escapeHtml(exp.role || exp.title || "")}</span>
          <span>${escapeHtml(normalizeDate(exp.start || exp.startDate, exp.end || exp.endDate))}</span>
        </div>
        <div class="job-meta">
          <span>${escapeHtml(exp.company || "")}</span>
          ${exp.location ? `<span>${escapeHtml(exp.location)}</span>` : ""}
        </div>
        ${exp.bullets && exp.bullets.length > 0
            ? `
        <ul class="job-bullets">
          ${exp.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
        `
            : exp.description
                ? `<p style="font-size: 10pt; margin-left: 0.2in; margin-bottom: 0.05in;">${escapeHtml(exp.description)}</p>`
                : ""}
      </div>
      `)
            .join("")}
    </div>
    `
        : ""}

    <!-- Projects -->
    ${hasProjects
        ? `
    <div class="section">
      <div class="section-title">PROJECTS</div>
      ${data.projects
            .filter((p) => p.name)
            .map((proj) => `
      <div class="project-item">
        <div class="project-name">${escapeHtml(proj.name || "")}</div>
        ${proj.tech && proj.tech.length > 0 ? `<div class="project-tech">${escapeHtml(proj.tech.join(", "))}</div>` : ""}
        ${proj.bullets && proj.bullets.length > 0
            ? `
        <ul class="project-bullets">
          ${proj.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
        `
            : proj.description
                ? `<p style="font-size: 10pt; margin-left: 0.2in; margin-bottom: 0.05in;">${escapeHtml(proj.description)}</p>`
                : ""}
      </div>
      `)
            .join("")}
    </div>
    `
        : ""}

    <!-- Skills -->
    ${skillsData.length > 0 && skillsData.some((s) => s.items.length > 0)
        ? `
    <div class="section">
      <div class="section-title">SKILLS</div>
      ${skillsData
            .filter((s) => s.items.length > 0)
            .map((skillGroup) => `
      <div class="skills-category">
        <span class="skills-category-name">${escapeHtml(skillGroup.category)}:</span>
        <span class="skills-list">${skillGroup.items.map((skill) => escapeHtml(skill)).join(", ")}</span>
      </div>
      `)
            .join("")}
    </div>
    `
        : ""}

    <!-- Education -->
    ${hasEducation
        ? `
    <div class="section">
      <div class="section-title">EDUCATION</div>
      ${data.education
            .filter((e) => e.institution || e.degree)
            .map((edu) => `
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
      `)
            .join("")}
    </div>
    `
        : ""}
  </div>
</body>
</html>
  `;
}
// HTML escaping for Node.js environment
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
async function generatePDF(resumeData, fileName) {
    const browser = await getBrowser();
    let page;
    try {
        page = await browser.newPage();
        // Set up page with specific dimensions for letter-size paper
        await page.setViewport({ width: 816, height: 1056 });
        // Generate HTML
        const html = generateResumeHTML(resumeData);
        // Set content
        await page.setContent(html, { waitUntil: "networkidle0" });
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: "Letter",
            margin: {
                top: "0.5in",
                right: "0.5in",
                bottom: "0.5in",
                left: "0.5in",
            },
            printBackground: true,
        });
        return pdfBuffer;
    }
    catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error("Failed to generate PDF");
    }
    finally {
        if (page) {
            await page.close();
        }
    }
}
async function savePDFToTemp(resumeData, fileName) {
    try {
        const pdfBuffer = await generatePDF(resumeData, fileName);
        // Create temp file
        const tempDir = os_1.default.tmpdir();
        const sanitizedFileName = fileName.replace(/[^a-z0-9._-]/gi, "_");
        const tempPath = path_1.default.join(tempDir, `${Date.now()}_${sanitizedFileName}`);
        // Write to temp file
        await fs_1.promises.writeFile(tempPath, pdfBuffer);
        return tempPath;
    }
    catch (error) {
        console.error("Error saving PDF to temp:", error);
        throw new Error("Failed to save PDF");
    }
}
async function closeBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        await browserInstance.close();
        browserInstance = null;
    }
}
