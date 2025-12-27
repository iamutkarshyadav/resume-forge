'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Resume Forge',
    description: 'This is a quick walkthrough to help you get started. You can skip it anytime.',
    position: 'bottom',
  },
  {
    id: 'upload-resume',
    title: 'Upload Your Resume',
    description: 'Start by uploading your resume. We support PDF, Word, and text files.',
    targetSelector: '[data-onboarding="upload"]',
    position: 'bottom',
  },
  {
    id: 'analyze',
    title: 'Analyze Your Resume',
    description: 'Once uploaded, analyze your resume against job descriptions to get detailed feedback.',
    targetSelector: '[data-onboarding="analyze"]',
    position: 'bottom',
  },
  {
    id: 'history',
    title: 'View Your History',
    description: 'Access all your previous analyses and track your progress over time.',
    targetSelector: '[data-onboarding="history"]',
    position: 'bottom',
  },
  {
    id: 'job-descriptions',
    title: 'Manage Job Descriptions',
    description: 'Save and manage job descriptions for quick access during analysis.',
    targetSelector: '[data-onboarding="job-descriptions"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'You\'re ready to start improving your resume. Good luck!',
    position: 'bottom',
  },
]

interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

function getElementPosition(selector: string): ElementPosition | null {
  const element = document.querySelector(selector)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  }
}

export function OnboardingWalkthrough({
  isOpen,
  steps = DEFAULT_ONBOARDING_STEPS,
  currentStep,
  onNext,
  onSkip,
  onComplete,
}: {
  isOpen: boolean
  steps?: OnboardingStep[]
  currentStep: number
  onNext: () => void
  onSkip: () => void
  onComplete: () => void
}) {
  const [targetPosition, setTargetPosition] = useState<ElementPosition | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  useEffect(() => {
    if (!step?.targetSelector) {
      setTargetPosition(null)
      return
    }

    const position = getElementPosition(step.targetSelector)
    setTargetPosition(position)

    const handleResize = () => {
      const newPosition = getElementPosition(step.targetSelector!)
      setTargetPosition(newPosition)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step?.targetSelector])

  useEffect(() => {
    if (!tooltipRef.current || !targetPosition) return

    const tooltip = tooltipRef.current
    const tooltipRect = tooltip.getBoundingClientRect()
    const padding = 16

    // Calculate position based on step position preference
    let top = targetPosition.top
    let left = targetPosition.left

    if (step?.position === 'bottom') {
      top = targetPosition.top + targetPosition.height + padding
      left = targetPosition.left + targetPosition.width / 2 - tooltipRect.width / 2
    } else if (step?.position === 'top') {
      top = targetPosition.top - tooltipRect.height - padding
      left = targetPosition.left + targetPosition.width / 2 - tooltipRect.width / 2
    } else if (step?.position === 'left') {
      top = targetPosition.top + targetPosition.height / 2 - tooltipRect.height / 2
      left = targetPosition.left - tooltipRect.width - padding
    } else if (step?.position === 'right') {
      top = targetPosition.top + targetPosition.height / 2 - tooltipRect.height / 2
      left = targetPosition.left + targetPosition.width + padding
    }

    // Keep tooltip in viewport
    if (left < padding) left = padding
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding
    }
    if (top < padding) top = padding

    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
  }, [targetPosition, step?.position])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete()
    } else {
      onNext()
    }
  }, [isLastStep, onNext, onComplete])

  if (!isOpen) return null

  return (
    <>
      {/* Spotlight overlay */}
      {targetPosition && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetPosition.left}
                  y={targetPosition.top}
                  width={targetPosition.width}
                  height={targetPosition.height}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#spotlight-mask)"
            />
          </svg>
          {/* Highlight border */}
          <div
            className="absolute border-2 border-yellow-400 rounded-lg pointer-events-auto cursor-pointer transition-all duration-300"
            style={{
              top: `${targetPosition.top - 4}px`,
              left: `${targetPosition.left - 4}px`,
              width: `${targetPosition.width + 8}px`,
              height: `${targetPosition.height + 8}px`,
              boxShadow: '0 0 0 4px rgba(250, 204, 21, 0.3)',
            }}
            onClick={handleNext}
          />
        </div>
      )}

      {/* Tooltip */}
      {!targetPosition && (
        <div className="fixed inset-0 z-40 bg-black/70" onClick={onSkip} />
      )}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 max-w-sm w-[90vw]"
        style={{
          position: 'fixed',
          minWidth: '300px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          aria-label="Close walkthrough"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step content */}
        <div className="pr-6">
          <h3 className="text-lg font-semibold mb-2">{step?.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{step?.description}</p>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index <= currentStep
                      ? 'bg-yellow-400 w-4'
                      : 'bg-zinc-300 dark:bg-zinc-600 w-2'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onSkip}
            className="h-8"
          >
            Skip
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleNext}
            className="h-8"
          >
            {isLastStep ? 'Done' : 'Next'}
          </Button>
        </div>
      </div>
    </>
  )
}
