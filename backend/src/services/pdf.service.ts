import PDFDocument from "pdfkit";
import { logger } from "../utils/logger";

export async function generateResumePDF(resumeData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margin: 50,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Deterministic Layout Implementation
      renderHeader(doc, resumeData);
      renderSummary(doc, resumeData);
      renderExperience(doc, resumeData);
      renderProjects(doc, resumeData);
      renderSkills(doc, resumeData);
      renderEducation(doc, resumeData);

      doc.end();
    } catch (err) {
      logger.error("Error in generateResumePDF", err);
      reject(err);
    }
  });
}

function renderHeader(doc: PDFKit.PDFDocument, data: any) {
  doc.fontSize(20).text(data.name || "Resume", { align: "center" });
  doc.fontSize(10).moveDown(0.5);
  
  const contactInfo = [
    data.email,
    data.phone,
    data.location,
    data.links?.linkedin,
    data.links?.github
  ].filter(Boolean).join(" | ");
  
  doc.text(contactInfo, { align: "center" });
  if (data.title) {
    doc.moveDown(0.2).text(data.title, { align: "center" });
  }
  doc.moveDown(1).lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(1);
}

function renderSummary(doc: PDFKit.PDFDocument, data: any) {
  if (!data.summary) return;
  doc.fontSize(14).text("Summary", { underline: true });
  doc.fontSize(10).moveDown(0.5).text(data.summary);
  doc.moveDown(1);
}

function renderExperience(doc: PDFKit.PDFDocument, data: any) {
  if (!data.experience || !Array.isArray(data.experience) || data.experience.length === 0) return;
  doc.fontSize(14).text("Professional Experience", { underline: true });
  doc.moveDown(0.5);

  data.experience.forEach((exp: any) => {
    doc.fontSize(11).text(`${exp.company || ""} - ${exp.title || exp.role || ""}`, { continued: true });
    doc.fontSize(10).text(` (${exp.startDate || exp.start || ""} - ${exp.endDate || exp.end || ""})`, { align: "right" });
    
    if (exp.location) {
      doc.fontSize(10).text(exp.location);
    }

    if (exp.description) {
       doc.moveDown(0.2).fontSize(10).text(exp.description);
    }

    if (Array.isArray(exp.bullets)) {
      exp.bullets.forEach((bullet: string) => {
        doc.moveDown(0.1).text(`• ${bullet}`, { indent: 15 });
      });
    }
    doc.moveDown(0.5);
  });
  doc.moveDown(0.5);
}

function renderProjects(doc: PDFKit.PDFDocument, data: any) {
  if (!data.projects || !Array.isArray(data.projects) || data.projects.length === 0) return;
  doc.fontSize(14).text("Projects", { underline: true });
  doc.moveDown(0.5);

  data.projects.forEach((proj: any) => {
    doc.fontSize(11).text(proj.name || "");
    if (Array.isArray(proj.tech) && proj.tech.length > 0) {
      doc.fontSize(9).text(`Tech: ${proj.tech.join(", ")}`, { oblique: true });
    }
    if (proj.description) {
      doc.fontSize(10).moveDown(0.2).text(proj.description);
    }
    if (Array.isArray(proj.bullets)) {
      proj.bullets.forEach((bullet: string) => {
        doc.moveDown(0.1).text(`• ${bullet}`, { indent: 15 });
      });
    }
    doc.moveDown(0.5);
  });
  doc.moveDown(0.5);
}

function renderSkills(doc: PDFKit.PDFDocument, data: any) {
  if (!data.skills) return;
  doc.fontSize(14).text("Skills", { underline: true });
  doc.moveDown(0.5);

  if (Array.isArray(data.skills)) {
    if (typeof data.skills[0] === "string") {
      doc.fontSize(10).text(data.skills.join(", "));
    } else {
      data.skills.forEach((skillGroup: any) => {
        doc.fontSize(10).text(`${skillGroup.category}: ${skillGroup.items?.join(", ")}`);
      });
    }
  }
  doc.moveDown(1);
}

function renderEducation(doc: PDFKit.PDFDocument, data: any) {
  if (!data.education || !Array.isArray(data.education) || data.education.length === 0) return;
  doc.fontSize(14).text("Education", { underline: true });
  doc.moveDown(0.5);

  data.education.forEach((edu: any) => {
    doc.fontSize(11).text(`${edu.institution || ""}`, { continued: true });
    doc.fontSize(10).text(` (${edu.startYear || edu.start || ""} - ${edu.endYear || edu.end || ""})`, { align: "right" });
    doc.fontSize(10).text(`${edu.degree || ""} ${edu.field ? `in ${edu.field}` : ""}`);
    if (edu.gpa) doc.text(`GPA: ${edu.gpa}`);
    doc.moveDown(0.5);
  });
}
