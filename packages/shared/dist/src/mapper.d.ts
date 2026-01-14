import { ResumeAST, TemplateRules } from "./ast";
export interface LegacyResumeData {
    name: string;
    email: string;
    phone: string;
    location?: string;
    title?: string;
    links?: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
    };
    summary: string;
    skills: string[] | {
        category: string;
        items: string[];
    }[];
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
export declare function mapToAST(data: LegacyResumeData, rules: TemplateRules): ResumeAST;
