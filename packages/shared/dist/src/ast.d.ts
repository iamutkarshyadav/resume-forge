import { z } from "zod";
export declare const ResumeHeaderSchema: z.ZodObject<{
    name: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    links: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["linkedin", "github", "portfolio", "other"]>;
        url: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "linkedin" | "github" | "portfolio" | "other";
        url: string;
        label?: string | undefined;
    }, {
        type: "linkedin" | "github" | "portfolio" | "other";
        url: string;
        label?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    location?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    links?: {
        type: "linkedin" | "github" | "portfolio" | "other";
        url: string;
        label?: string | undefined;
    }[] | undefined;
}, {
    name: string;
    location?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    links?: {
        type: "linkedin" | "github" | "portfolio" | "other";
        url: string;
        label?: string | undefined;
    }[] | undefined;
}>;
export declare const ResumeEntrySchema: z.ZodObject<{
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    role: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    bullets: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    tech: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    location?: string | null | undefined;
    date?: string | null | undefined;
    title?: string | null | undefined;
    role?: string | null | undefined;
    company?: string | null | undefined;
    description?: string | null | undefined;
    bullets?: string[] | null | undefined;
    tech?: string[] | null | undefined;
}, {
    location?: string | null | undefined;
    date?: string | null | undefined;
    title?: string | null | undefined;
    role?: string | null | undefined;
    company?: string | null | undefined;
    description?: string | null | undefined;
    bullets?: string[] | null | undefined;
    tech?: string[] | null | undefined;
}>;
export declare const ResumeSectionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    entries: z.ZodArray<z.ZodObject<{
        title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        role: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        bullets: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        tech: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        location?: string | null | undefined;
        date?: string | null | undefined;
        title?: string | null | undefined;
        role?: string | null | undefined;
        company?: string | null | undefined;
        description?: string | null | undefined;
        bullets?: string[] | null | undefined;
        tech?: string[] | null | undefined;
    }, {
        location?: string | null | undefined;
        date?: string | null | undefined;
        title?: string | null | undefined;
        role?: string | null | undefined;
        company?: string | null | undefined;
        description?: string | null | undefined;
        bullets?: string[] | null | undefined;
        tech?: string[] | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entries: {
        location?: string | null | undefined;
        date?: string | null | undefined;
        title?: string | null | undefined;
        role?: string | null | undefined;
        company?: string | null | undefined;
        description?: string | null | undefined;
        bullets?: string[] | null | undefined;
        tech?: string[] | null | undefined;
    }[];
    title: string;
    id: string;
}, {
    entries: {
        location?: string | null | undefined;
        date?: string | null | undefined;
        title?: string | null | undefined;
        role?: string | null | undefined;
        company?: string | null | undefined;
        description?: string | null | undefined;
        bullets?: string[] | null | undefined;
        tech?: string[] | null | undefined;
    }[];
    title: string;
    id: string;
}>;
export declare const ResumeASTSchema: z.ZodObject<{
    header: z.ZodObject<{
        name: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        links: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["linkedin", "github", "portfolio", "other"]>;
            url: z.ZodString;
            label: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "linkedin" | "github" | "portfolio" | "other";
            url: string;
            label?: string | undefined;
        }, {
            type: "linkedin" | "github" | "portfolio" | "other";
            url: string;
            label?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        location?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        links?: {
            type: "linkedin" | "github" | "portfolio" | "other";
            url: string;
            label?: string | undefined;
        }[] | undefined;
    }, {
        name: string;
        location?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        links?: {
            type: "linkedin" | "github" | "portfolio" | "other";
            url: string;
            label?: string | undefined;
        }[] | undefined;
    }>;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        entries: z.ZodArray<z.ZodObject<{
            title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            role: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            bullets: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            tech: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        }, "strip", z.ZodTypeAny, {
            location?: string | null | undefined;
            date?: string | null | undefined;
            title?: string | null | undefined;
            role?: string | null | undefined;
            company?: string | null | undefined;
            description?: string | null | undefined;
            bullets?: string[] | null | undefined;
            tech?: string[] | null | undefined;
        }, {
            location?: string | null | undefined;
            date?: string | null | undefined;
            title?: string | null | undefined;
            role?: string | null | undefined;
            company?: string | null | undefined;
            description?: string | null | undefined;
            bullets?: string[] | null | undefined;
            tech?: string[] | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        entries: {
            location?: string | null | undefined;
            date?: string | null | undefined;
            title?: string | null | undefined;
            role?: string | null | undefined;
            company?: string | null | undefined;
            description?: string | null | undefined;
            bullets?: string[] | null | undefined;
            tech?: string[] | null | undefined;
        }[];
        title: string;
        id: string;
    }, {
        entries: {
            location?: string | null | undefined;
            date?: string | null | undefined;
            title?: string | null | undefined;
            role?: string | null | undefined;
            company?: string | null | undefined;
            description?: string | null | undefined;
            bullets?: string[] | null | undefined;
            tech?: string[] | null | undefined;
        }[];
        title: string;
        id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    header: {
        name: string;
        location?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        links?: {
            type: "linkedin" | "github" | "portfolio" | "other";
            url: string;
            label?: string | undefined;
        }[] | undefined;
    };
    sections: {
        entries: {
            location?: string | null | undefined;
            date?: string | null | undefined;
            title?: string | null | undefined;
            role?: string | null | undefined;
            company?: string | null | undefined;
            description?: string | null | undefined;
            bullets?: string[] | null | undefined;
            tech?: string[] | null | undefined;
        }[];
        title: string;
        id: string;
    }[];
}, {
    header: {
        name: string;
        location?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        links?: {
            type: "linkedin" | "github" | "portfolio" | "other";
            url: string;
            label?: string | undefined;
        }[] | undefined;
    };
    sections: {
        entries: {
            location?: string | null | undefined;
            date?: string | null | undefined;
            title?: string | null | undefined;
            role?: string | null | undefined;
            company?: string | null | undefined;
            description?: string | null | undefined;
            bullets?: string[] | null | undefined;
            tech?: string[] | null | undefined;
        }[];
        title: string;
        id: string;
    }[];
}>;
export type ResumeAST = z.infer<typeof ResumeASTSchema>;
export type ResumeHeader = z.infer<typeof ResumeHeaderSchema>;
export type ResumeEntry = z.infer<typeof ResumeEntrySchema>;
export type ResumeSection = z.infer<typeof ResumeSectionSchema>;
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
        sectionOrder: string[];
        margins: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
    };
    limits: {
        maxBulletsPerEntry: number;
        maxEntriesPerSection: Record<string, number>;
    };
};
export declare const DEFAULT_TEMPLATE_RULES: TemplateRules;
