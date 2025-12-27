'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export interface ErrorDialogConfig {
  isOpen: boolean
  title: string
  message: string
  description?: string
  type?: 'error' | 'warning' | 'info'
  actions?: {
    primary?: {
      label: string
      onClick: () => void | Promise<void>
      loading?: boolean
    }
    secondary?: {
      label: string
      onClick: () => void | Promise<void>
    }
  }
  onClose?: () => void
}

const errorTypeConfig = {
  error: {
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
}

export function ErrorDialog({
  isOpen,
  title,
  message,
  description,
  type = 'error',
  actions,
  onClose,
}: ErrorDialogConfig) {
  const [isLoading, setIsLoading] = useState(false)
  const config = errorTypeConfig[type]

  const handlePrimaryAction = useCallback(async () => {
    if (!actions?.primary) return
    try {
      setIsLoading(true)
      await actions.primary.onClick()
    } finally {
      setIsLoading(false)
    }
  }, [actions])

  const handleSecondaryAction = useCallback(async () => {
    if (!actions?.secondary) return
    await actions.secondary.onClick()
  }, [actions])

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={`${config.bgColor} ${config.borderColor} rounded-lg border p-2`}>
              <AlertCircle className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground italic">
              {description}
            </DialogDescription>
          )}
        </div>

        <DialogFooter className="gap-2">
          {actions?.secondary && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSecondaryAction}
              disabled={isLoading}
            >
              {actions.secondary.label}
            </Button>
          )}
          {actions?.primary && (
            <Button
              type="button"
              variant={type === 'error' ? 'destructive' : 'default'}
              onClick={handlePrimaryAction}
              disabled={isLoading}
            >
              {actions.primary.label}
            </Button>
          )}
          {!actions?.primary && !actions?.secondary && (
            <Button
              type="button"
              variant="default"
              onClick={() => onClose?.()}
            >
              Dismiss
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook for managing error dialog state globally
 * Usage: const { showError, hideError, errorState } = useErrorDialog()
 */
export function useErrorDialog() {
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

  const handleClose = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }, [])

  return {
    showError,
    hideError,
    errorState: {
      ...errorState,
      onClose: handleClose,
    },
  }
}
