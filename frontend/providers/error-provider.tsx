'use client'

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useState,
} from 'react'
import { ErrorDialog, ErrorDialogConfig } from '@/components/error-dialog'
import { parseError, PlanLimitError } from '@/lib/errors'

interface ErrorContextType {
  showError: (config: Omit<ErrorDialogConfig, 'isOpen'>) => void
  showErrorFromException: (error: any, defaultTitle?: string) => void
  showPlanLimitError: (error: PlanLimitError) => void
  hideError: () => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errorState, setErrorState] = useState<ErrorDialogConfig>({
    isOpen: false,
    title: '',
    message: '',
  })

  const showError = useCallback((config: Omit<ErrorDialogConfig, 'isOpen'>) => {
    setErrorState({
      ...config,
      isOpen: true,
    })
  }, [])

  const hideError = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }, [])

  const showErrorFromException = useCallback(
    (error: any, defaultTitle = 'Something went wrong') => {
      const parsed = parseError(error)

      let title = defaultTitle
      let message = parsed.userMessage
      let type: 'error' | 'warning' | 'info' = 'error'
      let actions: ErrorDialogConfig['actions'] = undefined

      // Handle specific error codes
      if (parsed.code === 'CONFLICT') {
        title = 'Email Already Registered'
        message = 'This email is already registered. Please sign in instead.'
        type = 'warning'
        actions = {
          primary: {
            label: 'Go to Login',
            onClick: () => {
              window.location.href = '/login'
            },
          },
        }
      } else if (parsed.code === 'UNAUTHORIZED') {
        title = 'Session Expired'
        message = 'Your session has expired. Please sign in again.'
        type = 'warning'
        actions = {
          primary: {
            label: 'Sign In',
            onClick: () => {
              window.location.href = '/login'
            },
          },
        }
      } else if (parsed.code === 'FORBIDDEN') {
        if (message.includes('Analysis limit')) {
          title = 'Analysis Limit Reached'
          message = 'You have reached your monthly analysis limit. Your limit resets on the first of each month. Upgrade your plan for unlimited analyses.'
          type = 'warning'
          actions = {
            primary: {
              label: 'Upgrade Plan',
              onClick: () => {
                window.location.href = '/settings?tab=plan'
              },
            },
            secondary: {
              label: 'Dismiss',
              onClick: hideError,
            },
          }
        } else if (message.includes('AI generation limit')) {
          title = 'Generation Limit Reached'
          message = 'You have reached your monthly AI generation limit. Your limit resets on the first of each month. Upgrade your plan for unlimited generations.'
          type = 'warning'
          actions = {
            primary: {
              label: 'Upgrade Plan',
              onClick: () => {
                window.location.href = '/settings?tab=plan'
              },
            },
            secondary: {
              label: 'Dismiss',
              onClick: hideError,
            },
          }
        } else {
          title = 'Permission Denied'
          message = "You don't have permission to perform this action."
        }
      } else if (parsed.code === 'BAD_REQUEST') {
        title = 'Invalid Request'
      } else if (parsed.code === 'NOT_FOUND') {
        title = 'Not Found'
        type = 'warning'
      } else if (parsed.code === 'TOO_MANY_REQUESTS') {
        title = 'Too Many Requests'
        message = 'Please wait a moment before trying again.'
        type = 'warning'
        actions = {
          primary: {
            label: 'Dismiss',
            onClick: hideError,
          },
        }
      } else if (parsed.code === 'INTERNAL_SERVER_ERROR') {
        title = 'Server Error'
        message = 'The server encountered an error. Please try again.'
        actions = {
          primary: {
            label: 'Try Again',
            onClick: hideError,
          },
        }
      }

      showError({
        title,
        message,
        type,
        actions,
      })
    },
    [showError, hideError]
  )

  const showPlanLimitError = useCallback(
    (error: PlanLimitError) => {
      showError({
        title: 'Limit Reached',
        message: error.getUserMessage(),
        type: 'warning',
        description: error.getUpgradeMessage(),
        actions: {
          primary: {
            label: 'Upgrade Plan',
            onClick: () => {
              window.location.href = '/settings?tab=plan'
            },
          },
          secondary: {
            label: 'Dismiss',
            onClick: hideError,
          },
        },
      })
    },
    [showError, hideError]
  )

  const handleDialogClose = useCallback(() => {
    hideError()
  }, [hideError])

  return (
    <ErrorContext.Provider
      value={{
        showError,
        showErrorFromException,
        showPlanLimitError,
        hideError,
      }}
    >
      {children}
      <ErrorDialog {...errorState} onClose={handleDialogClose} />
    </ErrorContext.Provider>
  )
}

export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorHandler must be used within ErrorProvider')
  }
  return context
}
