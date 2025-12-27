'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { OnboardingWalkthrough, DEFAULT_ONBOARDING_STEPS } from '@/components/onboarding-walkthrough'
import { trpc } from '@/lib/trpc'

interface OnboardingContextType {
  showWalkthrough: boolean
  currentStep: number
  isLoading: boolean
  nextStep: () => void
  skipWalkthrough: () => void
  completeWalkthrough: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuth, setHasAuth] = useState(false)
  const [checkAuthComplete, setCheckAuthComplete] = useState(false)

  // Check if authentication token exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      setHasAuth(!!token)
      setCheckAuthComplete(true)
    }
  }, [])

  // Fetch onboarding status only if authenticated
  // Using skip property for more explicit control
  const { data: status, isLoading: statusLoading, error } = trpc.onboarding.getStatus.useQuery(
    undefined,
    {
      enabled: checkAuthComplete && hasAuth, // Only query if we have verified there's an auth token
      staleTime: Infinity, // Don't refetch automatically
      retry: (failureCount, error) => {
        // Don't retry on auth errors (401, 403)
        const code = (error as any)?.data?.code;
        if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
          return false;
        }
        // Retry up to 2 times on other errors
        return failureCount < 2;
      },
      throwOnError: false, // Don't throw - handle error gracefully
    }
  )

  // Complete walkthrough mutation
  const completeWalkthroughMutation = trpc.onboarding.complete.useMutation()
  const skipWalkthroughMutation = trpc.onboarding.skip.useMutation()

  // Initialize walkthrough based on status
  useEffect(() => {
    // Wait until we've checked auth status
    if (!checkAuthComplete) {
      return
    }

    // Don't show walkthrough if not authenticated
    if (!hasAuth) {
      setIsLoading(false)
      setShowWalkthrough(false)
      return
    }

    setIsLoading(statusLoading)
    if (statusLoading) return

    // Handle errors gracefully - don't crash on 401 or other errors
    // Log them for debugging, but don't show walkthrough and don't propagate to ErrorBoundary
    if (error) {
      const errorMsg = (error as any)?.message || String(error)
      const errorCode = (error as any)?.data?.code
      console.warn(`[OnboardingProvider] Status fetch failed [${errorCode}]:`, errorMsg)
      // Degrade gracefully: just don't show the walkthrough
      setShowWalkthrough(false)
      setIsLoading(false)
      return
    }

    // If status is undefined/null, don't show walkthrough
    if (!status) {
      setShowWalkthrough(false)
      setIsLoading(false)
      return
    }

    // Show walkthrough only for new users who haven't skipped it
    if (status.isNew && !status.skipped) {
      setShowWalkthrough(true)
      setCurrentStep(0)
    } else {
      setShowWalkthrough(false)
    }
    setIsLoading(false)
  }, [status, statusLoading, hasAuth, error, checkAuthComplete])

  const nextStep = useCallback(() => {
    if (currentStep < DEFAULT_ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep])

  const skipWalkthrough = useCallback(async () => {
    try {
      await skipWalkthroughMutation.mutateAsync()
    } catch (error) {
      const errorMsg = (error as any)?.message || String(error)
      const errorCode = (error as any)?.data?.code
      console.warn(`[OnboardingProvider] Error skipping walkthrough [${errorCode}]:`, errorMsg)
      // Still close the walkthrough even if mutation fails - don't block user
    }
    setShowWalkthrough(false)
  }, [skipWalkthroughMutation])

  const completeWalkthrough = useCallback(async () => {
    try {
      await completeWalkthroughMutation.mutateAsync()
    } catch (error) {
      const errorMsg = (error as any)?.message || String(error)
      const errorCode = (error as any)?.data?.code
      console.warn(`[OnboardingProvider] Error completing walkthrough [${errorCode}]:`, errorMsg)
      // Still close the walkthrough even if mutation fails - don't block user
    }
    setShowWalkthrough(false)
  }, [completeWalkthroughMutation])

  return (
    <OnboardingContext.Provider
      value={{
        showWalkthrough,
        currentStep,
        isLoading,
        nextStep,
        skipWalkthrough,
        completeWalkthrough,
      }}
    >
      {children}
      {showWalkthrough && !isLoading && (
        <OnboardingWalkthrough
          isOpen={showWalkthrough}
          steps={DEFAULT_ONBOARDING_STEPS}
          currentStep={currentStep}
          onNext={nextStep}
          onSkip={skipWalkthrough}
          onComplete={completeWalkthrough}
        />
      )}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
