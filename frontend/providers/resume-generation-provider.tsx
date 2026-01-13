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
  const [resumeId, setResumeIdState] = useState<string | null>(null)
  const [jdText, setJdTextState] = useState<string | null>(null)
  const [originalResumeData, setOriginalResumeDataState] = useState<ResumeData | null>(null)
  const [generatedResumeData, setGeneratedResumeDataState] = useState<ResumeData | null>(null)
  const [selectedTemplate, setSelectedTemplateState] = useState<TemplateType | null>(null)

  // Initialize state from sessionStorage on mount (client-side only)
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('resume-generation-state')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.resumeId) setResumeIdState(parsed.resumeId)
          if (parsed.jdText) setJdTextState(parsed.jdText)
          if (parsed.originalResumeData) setOriginalResumeDataState(parsed.originalResumeData)
          if (parsed.generatedResumeData) setGeneratedResumeDataState(parsed.generatedResumeData)
          if (parsed.selectedTemplate) setSelectedTemplateState(parsed.selectedTemplate)
        }
      } catch (e) {
        console.error('Failed to load resume state from session storage', e)
      }
    }
  })

  // Helper to update state and storage
  const persistState = (key: string, value: any) => {
    try {
      const currentState = sessionStorage.getItem('resume-generation-state')
      const parsed = currentState ? JSON.parse(currentState) : {}
      const newState = { ...parsed, [key]: value }
      sessionStorage.setItem('resume-generation-state', JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to save resume state', e)
    }
  }

  const setResumeId = (id: string | null) => {
    setResumeIdState(id)
    persistState('resumeId', id)
  }

  const setJdText = (text: string | null) => {
    setJdTextState(text)
    persistState('jdText', text)
  }

  const setOriginalResumeData = (data: ResumeData | null) => {
    setOriginalResumeDataState(data)
    persistState('originalResumeData', data)
  }

  const setGeneratedResumeData = (data: ResumeData | null) => {
    setGeneratedResumeDataState(data)
    persistState('generatedResumeData', data)
  }

  const setSelectedTemplate = (template: TemplateType | null) => {
    setSelectedTemplateState(template)
    persistState('selectedTemplate', template)
  }

  const resetFlow = () => {
    setResumeIdState(null)
    setJdTextState(null)
    setOriginalResumeDataState(null)
    setGeneratedResumeDataState(null)
    setSelectedTemplateState(null)
    sessionStorage.removeItem('resume-generation-state')
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
