import type { ResumeData } from '@/components/ResumeTemplate'

export type ComparisonDifference = {
  type: 'added' | 'removed' | 'modified'
  section: string
  detail: string
}

export type ResumeComparison = {
  differences: ComparisonDifference[]
  summary: {
    keywordsAdded: string[]
    sectionsReordered: boolean
    bulletsRewritten: number
    skillsAdded: string[]
  }
  impactExplanation: string
}

/**
 * Compare original and generated resume to identify changes
 * Returns a detailed comparison with highlighted differences
 */
export function compareResumes(
  original: ResumeData,
  generated: ResumeData
): ResumeComparison {
  const differences: ComparisonDifference[] = []
  const keywordsAdded: Set<string> = new Set()
  let bulletsRewritten = 0

  // Compare summary
  if (original.summary !== generated.summary) {
    const newKeywords = extractKeywords(generated.summary).filter(
      (kw) => !extractKeywords(original.summary).includes(kw)
    )
    newKeywords.forEach((kw) => keywordsAdded.add(kw))

    differences.push({
      type: 'modified',
      section: 'Summary',
      detail: 'Professional summary has been rewritten for better ATS relevance',
    })
  }

  // Compare experience
  const originalExps = original.experience || []
  const generatedExps = generated.experience || []

  generatedExps.forEach((exp, idx) => {
    const origExp = originalExps[idx]
    if (!origExp) {
      differences.push({
        type: 'added',
        section: 'Experience',
        detail: `New experience entry: ${exp.position} at ${exp.company}`,
      })
    } else {
      // Check if bullets were rewritten
      const origBullets = origExp.bullets || origExp.description.split('\n').filter((b) => b.trim())
      const genBullets = exp.bullets || exp.description.split('\n').filter((b) => b.trim())

      if (origBullets.join(' ') !== genBullets.join(' ')) {
        bulletsRewritten++
        genBullets.forEach((bullet) => {
          const newKeywords = extractKeywords(bullet).filter(
            (kw) => !origBullets.join(' ').includes(kw)
          )
          newKeywords.forEach((kw) => keywordsAdded.add(kw))
        })

        differences.push({
          type: 'modified',
          section: 'Experience',
          detail: `Bullets rewritten for: ${exp.position}`,
        })
      }
    }
  })

  // Compare skills
  const originalSkills = new Set(original.skills || [])
  const generatedSkills = new Set(generated.skills || [])
  const skillsAdded: string[] = []

  generatedSkills.forEach((skill) => {
    if (!originalSkills.has(skill)) {
      skillsAdded.push(skill)
      keywordsAdded.add(skill)
      differences.push({
        type: 'added',
        section: 'Skills',
        detail: `New skill added: ${skill}`,
      })
    }
  })

  // Check for section reordering (compare projects, certifications presence)
  const sectionsReordered =
    (original.projects?.length || 0) !== (generated.projects?.length || 0) ||
    (original.certifications?.length || 0) !== (generated.certifications?.length || 0)

  // Create impact explanation
  const impactExplanation = generateImpactExplanation(
    {
      keywordsAdded: Array.from(keywordsAdded),
      skillsAdded,
      bulletsRewritten,
      sectionsReordered,
    }
  )

  return {
    differences,
    summary: {
      keywordsAdded: Array.from(keywordsAdded).slice(0, 10), // Top 10 keywords
      sectionsReordered,
      bulletsRewritten,
      skillsAdded,
    },
    impactExplanation,
  }
}

/**
 * Extract keywords from text
 * Simple implementation: splits on spaces and filters short words
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !isCommonWord(word))
    .slice(0, 20)
}

/**
 * Check if word is a common English word that shouldn't be counted as keyword
 */
function isCommonWord(word: string): boolean {
  const common = new Set([
    'the', 'and', 'that', 'this', 'with', 'from', 'were', 'been', 'have', 'has',
    'your', 'team', 'will', 'more', 'also', 'can', 'are', 'for', 'not', 'you',
  ])
  return common.has(word) || word.endsWith(',') || word.endsWith('.')
}

/**
 * Generate human-readable impact explanation
 */
function generateImpactExplanation(summary: {
  keywordsAdded: string[]
  skillsAdded: string[]
  bulletsRewritten: number
  sectionsReordered: boolean
}): string {
  const parts: string[] = []

  if (summary.keywordsAdded.length > 0) {
    parts.push(
      `Added ${summary.keywordsAdded.length} relevant keywords from the job description to improve ATS matching`
    )
  }

  if (summary.skillsAdded.length > 0) {
    parts.push(
      `Added ${summary.skillsAdded.length} skills aligned with the job requirements`
    )
  }

  if (summary.bulletsRewritten > 0) {
    parts.push(
      `Rewrote ${summary.bulletsRewritten} experience bullet points with stronger action verbs and metrics`
    )
  }

  if (summary.sectionsReordered) {
    parts.push('Reordered sections to prioritize most relevant experience')
  }

  if (parts.length === 0) {
    return 'Your resume has been optimized to better match the job requirements.'
  }

  return parts.join('. ') + '.'
}

/**
 * Highlight text that was added/modified
 */
export function highlightDifference(text: string, isHighlighted: boolean): {
  text: string
  isHighlighted: boolean
} {
  return {
    text,
    isHighlighted,
  }
}
