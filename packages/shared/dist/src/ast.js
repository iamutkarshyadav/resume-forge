"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TEMPLATE_RULES = exports.ResumeASTSchema = exports.ResumeSectionSchema = exports.ResumeEntrySchema = exports.ResumeHeaderSchema = void 0;
const zod_1 = require("zod");
// --- Zod Schemas ---
exports.ResumeHeaderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    location: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Invalid email").optional(),
    phone: zod_1.z.string().optional(),
    links: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(["linkedin", "github", "portfolio", "other"]),
        url: zod_1.z.string().url("Invalid URL"),
        label: zod_1.z.string().optional()
    })).optional()
});
exports.ResumeEntrySchema = zod_1.z.object({
    title: zod_1.z.string().optional().nullable(),
    role: zod_1.z.string().optional().nullable(),
    company: zod_1.z.string().optional().nullable(), // Or 'institution' for education
    location: zod_1.z.string().optional().nullable(),
    date: zod_1.z.string().optional().nullable(), // Pre-formatted date string "Jan 2020 - Present"
    description: zod_1.z.string().optional().nullable(),
    bullets: zod_1.z.array(zod_1.z.string()).optional().nullable(),
    tech: zod_1.z.array(zod_1.z.string()).optional().nullable() // For projects
});
exports.ResumeSectionSchema = zod_1.z.object({
    id: zod_1.z.string(), // e.g., 'experience', 'education'
    title: zod_1.z.string(), // Display title e.g. "Professional Experience"
    entries: zod_1.z.array(exports.ResumeEntrySchema)
});
exports.ResumeASTSchema = zod_1.z.object({
    header: exports.ResumeHeaderSchema,
    sections: zod_1.z.array(exports.ResumeSectionSchema)
});
exports.DEFAULT_TEMPLATE_RULES = {
    id: "standard",
    page: {
        size: "LETTER",
        maxPages: 1
    },
    typography: {
        fontFamily: "Times-Roman", // Standard PDF font, backend safe
        baseFontSize: 10, // pt
        headerFontSize: 12,
        lineHeight: 1.4
    },
    layout: {
        columns: 1,
        sectionOrder: ["experience", "projects", "skills", "education"],
        margins: {
            top: 0.5,
            right: 0.5,
            bottom: 0.5,
            left: 0.5
        }
    },
    limits: {
        maxBulletsPerEntry: 4,
        maxEntriesPerSection: {
            experience: 4,
            projects: 3,
            education: 2,
            skills: 1
        }
    }
};
