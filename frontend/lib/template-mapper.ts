import type { ResumeData } from '@/components/ResumeTemplate'
import type { TemplateType } from '@/providers/resume-generation-provider'

/**
 * Templates are structural, not stylistic
 * They determine which sections are included and their order
 * All templates work with the same underlying ResumeData structure
 */

export type TemplateConfig = {
  id: TemplateType
  name: string
  description: string
  sections: {
    header: boolean
    summary: boolean
    experience: boolean
    projects: boolean
    skills: boolean
    education: boolean
    certifications: boolean
  }
  sectionOrder: string[]
  atsOptimized: boolean
  useCase: string
}

export const TEMPLATES: Record<TemplateType, TemplateConfig> = {
  'classic-ats': {
    id: 'classic-ats',
    name: 'Classic ATS',
    description: 'Simple, clean format optimized for ATS parsing. Traditional chronological layout.',
    sections: {
      header: true,
      summary: true,
      experience: true,
      projects: false,
      skills: true,
      education: true,
      certifications: false,
    },
    sectionOrder: ['header', 'summary', 'experience', 'skills', 'education'],
    atsOptimized: true,
    useCase: 'Traditional roles, corporate positions, conservative industries',
  },
  'modern-ats': {
    id: 'modern-ats',
    name: 'Modern ATS',
    description: 'Contemporary design with clear sections. ATS-friendly with modern visual hierarchy.',
    sections: {
      header: true,
      summary: true,
      experience: true,
      projects: true,
      skills: true,
      education: true,
      certifications: false,
    },
    sectionOrder: ['header', 'summary', 'experience', 'projects', 'skills', 'education'],
    atsOptimized: true,
    useCase: 'Mixed roles, modern companies, creative industries',
  },
  'tech-focused': {
    id: 'tech-focused',
    name: 'Tech-Focused',
    description: 'Emphasizes projects and technical skills. Great for engineering and developer roles.',
    sections: {
      header: true,
      summary: true,
      projects: true,
      experience: true,
      skills: true,
      education: true,
      certifications: true,
    },
    sectionOrder: ['header', 'summary', 'projects', 'experience', 'skills', 'certifications', 'education'],
    atsOptimized: true,
    useCase: 'Software engineering, DevOps, data science, technical roles',
  },
  'executive': {
    id: 'executive',
    name: 'Executive',
    description: 'Emphasizes impact and leadership. Ideal for executive and senior management roles.',
    sections: {
      header: true,
      summary: true,
      experience: true,
      projects: false,
      skills: true,
      education: true,
      certifications: false,
    },
    sectionOrder: ['header', 'summary', 'experience', 'skills', 'education'],
    atsOptimized: true,
    useCase: 'Executive, C-suite, senior management, director-level positions',
  },
  'faang-path': {
    id: 'faang-path',
    name: 'FAANG Path',
    description: 'Optimized for major tech companies. Emphasizes impact metrics and technical projects.',
    sections: {
      header: true,
      summary: true,
      experience: true,
      projects: true,
      skills: true,
      education: true,
      certifications: true,
    },
    sectionOrder: ['header', 'summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
    atsOptimized: true,
    useCase: 'Big tech companies (FAANG), fast-growing startups, senior tech roles',
  },
}

/**
 * Map resume data to template
 * This is a deterministic function that always returns the same output for the same input
 * It filters sections based on the template configuration
 */
export function mapResumeToTemplate(
  resumeData: ResumeData,
  templateType: TemplateType
): ResumeData {
  const template = TEMPLATES[templateType]

  // Start with the base data
  let mappedData: ResumeData = {
    name: resumeData.name,
    email: resumeData.email,
    phone: resumeData.phone,
    location: resumeData.location,
    summary: template.sections.summary ? resumeData.summary : '',
    experience: template.sections.experience ? resumeData.experience : [],
    skills: template.sections.skills ? resumeData.skills : [],
    education: template.sections.education ? resumeData.education : [],
  }

  // Add optional sections if included in template
  if (template.sections.projects && resumeData.projects) {
    mappedData.projects = resumeData.projects
  }

  if (template.sections.certifications && resumeData.certifications) {
    mappedData.certifications = resumeData.certifications
  }

  return mappedData
}

/**
 * Get template info
 */
export function getTemplateInfo(templateType: TemplateType): TemplateConfig {
  return TEMPLATES[templateType]
}

/**
 * Get all available templates (for selection page)
 */
export function getAllTemplates(): TemplateConfig[] {
  return Object.values(TEMPLATES)
}

/**
 * Validate template type
 */
export function isValidTemplate(templateType: any): templateType is TemplateType {
  return templateType in TEMPLATES
}
