'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react'
import type { ResumeData } from '@/components/ResumeTemplate'

export type TemplateType = 'classic-ats' | 'modern-ats' | 'tech-focused' | 'executive' | 'faang-path'

interface ResumeGenerationContextType {
  // Flow state
  resumeId: string | null
  jdText: string | null
  originalResumeData: ResumeData | null
  generatedResumeData: ResumeData | null
  selectedTemplate: TemplateType | null
  
  // Flow actions
  setResumeId: (id: string) => void
  setJdText: (text: string) => void
  setOriginalResumeData: (data: ResumeData) => void
  setGeneratedResumeData: (data: ResumeData) => void
  setSelectedTemplate: (template: TemplateType) => void
  
  // Flow reset
  resetFlow: () => void
}

const ResumeGenerationContext = createContext<ResumeGenerationContextType | undefined>(undefined)

export function ResumeGenerationProvider({ children }: { children: ReactNode }) {
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [jdText, setJdText] = useState<string | null>(null)
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null)
  const [generatedResumeData, setGeneratedResumeData] = useState<ResumeData | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null)

  const resetFlow = () => {
    setResumeId(null)
    setJdText(null)
    setOriginalResumeData(null)
    setGeneratedResumeData(null)
    setSelectedTemplate(null)
  }

  return (
    <ResumeGenerationContext.Provider
      value={{
        resumeId,
        jdText,
        originalResumeData,
        generatedResumeData,
        selectedTemplate,
        setResumeId,
        setJdText,
        setOriginalResumeData,
        setGeneratedResumeData,
        setSelectedTemplate,
        resetFlow,
      }}
    >
      {children}
    </ResumeGenerationContext.Provider>
  )
}

export function useResumeGeneration() {
  const context = useContext(ResumeGenerationContext)
  if (!context) {
    throw new Error('useResumeGeneration must be used within ResumeGenerationProvider')
  }
  return context
}

// Re-export ResumeData type for convenience
export type { ResumeData }
