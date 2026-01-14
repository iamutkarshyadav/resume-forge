import { z } from "zod";

// --- Zod Schemas ---

export const ResumeHeaderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  links: z.array(z.object({
    type: z.enum(["linkedin", "github", "portfolio", "other"]),
    url: z.string().url("Invalid URL"),
    label: z.string().optional()
  })).optional()
});

export const ResumeEntrySchema = z.object({
  title: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(), // Or 'institution' for education
  location: z.string().optional().nullable(),
  date: z.string().optional().nullable(), // Pre-formatted date string "Jan 2020 - Present"
  description: z.string().optional().nullable(),
  bullets: z.array(z.string()).optional().nullable(),
  tech: z.array(z.string()).optional().nullable() // For projects
});

export const ResumeSectionSchema = z.object({
  id: z.string(), // e.g., 'experience', 'education'
  title: z.string(), // Display title e.g. "Professional Experience"
  entries: z.array(ResumeEntrySchema)
});

export const ResumeASTSchema = z.object({
  header: ResumeHeaderSchema,
  sections: z.array(ResumeSectionSchema)
});

export type ResumeAST = z.infer<typeof ResumeASTSchema>;
export type ResumeHeader = z.infer<typeof ResumeHeaderSchema>;
export type ResumeEntry = z.infer<typeof ResumeEntrySchema>;
export type ResumeSection = z.infer<typeof ResumeSectionSchema>;


// --- Template Constraints ---

export type TemplateRules = {
  id: string;
  page: {
    size: "A4" | "LETTER";
    maxPages: number;
  };
  typography: {
    fontFamily: string;
    baseFontSize: number;
    headerFontSize: number;
    lineHeight: number;
  };
  layout: {
    columns: 1 | 2;
    sectionOrder: string[]; // IDs of sections in order
    margins: {
        top: number; // inches
        right: number;
        bottom: number;
        left: number;
    }
  };
  limits: {
    maxBulletsPerEntry: number;
    maxEntriesPerSection: Record<string, number>; // sectionId -> max entries
  };
};

export const DEFAULT_TEMPLATE_RULES: TemplateRules = {
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
