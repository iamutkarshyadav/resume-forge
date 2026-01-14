import { ResumeAST, ResumeEntry, TemplateRules } from "./ast";

// Define the input shape (legacy ResumeData)
// We define it loosely here to avoid cyclic deps, or we could copy the interface.
// For now, I'll use a type compatible with what we saw in ResumeTemplate.tsx
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

export function mapToAST(data: LegacyResumeData, rules: TemplateRules): ResumeAST {
  // Helper to ensure URL has a protocol
  const ensureProtocol = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("tel:")) {
      return url;
    }
    return `https://${url}`;
  };

  const header = {
    name: data.name,
    location: data.location,
    email: data.email,
    phone: data.phone,
    links: data.links ? Object.entries(data.links).map(([type, url]) => ({
      type: type as any,
      url: ensureProtocol(url as string),
      label: type.charAt(0).toUpperCase() + type.slice(1)
    })) : []
  };

  const sections: ResumeAST["sections"] = [];

  // Helper to get formatted date
  const fmtDate = (s?: string, e?: string) => {
    if (!s && !e) return "";
    if (s && e) return `${s} – ${e}`;
    return s || e || "";
  };

  // Helper to ensure description is a string
  const ensureString = (val: any): string => {
    if (!val) return "";
    if (Array.isArray(val)) return val.join("\n");
    return String(val);
  };

  // Experience
  if (data.experience && Array.isArray(data.experience)) {
    sections.push({
      id: "experience",
      title: "Professional Experience",
      entries: data.experience
        .filter(exp => exp !== null && exp !== undefined)
        .map(exp => ({
          title: exp.role || exp.title,
          company: exp.company,
          location: exp.location,
          date: fmtDate(exp.startDate || exp.start, exp.endDate || exp.end),
          description: ensureString(exp.description),
          bullets: Array.isArray(exp.bullets) ? exp.bullets : []
        }))
    });
  }

  // Projects
  if (data.projects && Array.isArray(data.projects)) {
    sections.push({
      id: "projects",
      title: "Projects",
      entries: data.projects
        .filter(proj => proj !== null && proj !== undefined)
        .map(proj => ({
          title: proj.name,
          description: ensureString(proj.description),
          tech: Array.isArray(proj.tech) ? proj.tech : [],
          bullets: Array.isArray(proj.bullets) ? proj.bullets : []
        }))
    });
  }

  // Education
  if (data.education && Array.isArray(data.education)) {
    sections.push({
      id: "education",
      title: "Education",
      entries: data.education
        .filter(edu => edu !== null && edu !== undefined)
        .map(edu => ({
          title: (edu.degree || "") + (edu.field ? ` in ${edu.field}` : ""),
          company: edu.institution || "", // mapping institution to company field for generic renderer
          date: fmtDate(edu.startYear || edu.start, edu.endYear || edu.end),
          description: edu.gpa ? `GPA: ${edu.gpa}` : ""
        }))
    });
  }

  // Skills
  // Flatten or keep categorized? AST supports generic entries. 
  // We'll create a special 'skills' section where entries are categories.
  if (data.skills && data.skills.length > 0) {
    const skillEntries: ResumeEntry[] = [];
    
    // Check if it's array of strings or categories
    const isCategorized = data.skills.length > 0 && typeof data.skills[0] === 'object' && 'category' in data.skills[0];
    
    if (isCategorized) {
       (data.skills as { category: string; items: string[] }[]).forEach(cat => {
           if (cat.items && cat.items.length > 0) {
             skillEntries.push({
               title: cat.category, // Use title as category name
               bullets: cat.items // Use bullets as skill items logic
             });
           }
       });
    } else {
       // Flat list
       skillEntries.push({
           title: "Skills",
           bullets: data.skills as string[]
       });
    }

    if (skillEntries.length > 0) {
        sections.push({
            id: "skills",
            title: "Skills",
            entries: skillEntries
        });
    }
  }

  // Sort sections based on template rules
  const sortedSections = sections.sort((a, b) => {
    const idxA = rules.layout.sectionOrder.indexOf(a.id);
    const idxB = rules.layout.sectionOrder.indexOf(b.id);
    // If not in order list, push to end
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  return { header, sections: sortedSections };
}
