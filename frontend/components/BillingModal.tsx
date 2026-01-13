'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

interface BillingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCredits: number
  creditsNeeded: number
  returnUrl?: string
}

interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  credits: number
  popular: boolean
}

export function BillingModal({
  open,
  onOpenChange,
  currentCredits,
  creditsNeeded,
  returnUrl,
}: BillingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [isLoading, setIsLoading] = useState(false)

  const { data: plans = [] } = trpc.billing.getPlans.useQuery()
  const createCheckoutMutation = trpc.billing.createCheckoutSession.useMutation()

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    setIsLoading(true)

    try {
      const currentUrl = new URL(window.location.href)
      const successUrl = returnUrl || `${window.location.origin}/billing/success`
      const cancelUrl = currentUrl.href

      // ✅ Generate unique idempotency key
      const idempotencyKey = crypto.randomUUID()
      console.log('🆔 Idempotency Key:', idempotencyKey)

      const result = await createCheckoutMutation.mutateAsync({
        planId,
        successUrl,
        cancelUrl,
        idempotencyKey, // ✅ Added
      })

      if (result.url) {
        console.log('✅ Redirecting to Stripe Checkout for session:', result.sessionId)
        // Redirect to Stripe Checkout
        window.location.href = result.url
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error)
      toast.error(error.message || 'Failed to create checkout session')
      setIsLoading(false)
    }
  }

  const needsPlanId = plans.find((p: PricingPlan) => p.credits >= creditsNeeded)?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-neutral-800 bg-neutral-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Unlock PDF Downloads
          </DialogTitle>
          <DialogDescription>
            You don't have enough credits. Choose a plan to download your resume.
          </DialogDescription>
        </DialogHeader>

        {/* Credit Status */}
        <div className="mb-6 rounded-lg bg-neutral-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Current Credits</p>
              <p className="text-2xl font-semibold">{currentCredits}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-400">Credits Needed</p>
              <p className="text-2xl font-semibold text-yellow-500">{creditsNeeded}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          {plans.map((plan: PricingPlan) => {
            const isSelected = selectedPlan === plan.id
            const meetsRequirement = plan.credits >= creditsNeeded
            const isPopular = plan.popular

            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-4 bg-gradient-to-r from-purple-400 to-amber-300 text-amber-950">
                    Best Value
                  </Badge>
                )}

                <div className="mb-4">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-sm text-neutral-400 mt-1">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold">
                    ${(plan.price / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500">one-time payment</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{plan.credits} Credits</span>
                  </div>
                  {meetsRequirement && (
                    <div className="flex items-center gap-2 text-green-400">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-semibold">Meets your needs</span>
                    </div>
                  )}
                </div>

                <div
                  className={buttonVariants({
                    size: 'sm',
                    className: `w-full ${
                      isSelected
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`
                  })}
                >
                  {isLoading && isSelected ? 'Processing...' : 'Select'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-neutral-900 p-4 text-sm text-neutral-400">
          <p>
            ✓ Secure payment via Stripe • No subscription • Credits never expire
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
