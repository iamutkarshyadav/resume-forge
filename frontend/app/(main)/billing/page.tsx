'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Zap } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  credits: number
  popular: boolean
}

export default function BillingPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [isLoading, setIsLoading] = useState(false)

  const { data: plans = [] } = trpc.billing.getPlans.useQuery()
  const { data: creditsData } = trpc.billing.getUserCredits.useQuery()
  const createCheckoutMutation = trpc.billing.createCheckoutSession.useMutation()

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    setIsLoading(true)

    try {
      const successUrl = `${window.location.origin}/billing/success`
      const cancelUrl = window.location.href

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

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-semibold tracking-tight">Get More Credits</h1>
          <p className="text-neutral-400 mt-2 max-w-2xl">
            Download more of your optimized resumes. Credits are one-time payments with no subscription
            required. Your credits never expire.
          </p>
        </motion.div>

        {/* Current Credits */}
        {creditsData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-6 rounded-lg border border-neutral-800 bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Your Current Credits</p>
                <p className="text-4xl font-bold mt-2">{creditsData.credits}</p>
              </div>
              <Zap className="h-12 w-12 text-yellow-500" />
            </div>
          </motion.div>
        )}

        {/* Pricing Plans */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12"
        >
          {plans.map((plan: PricingPlan) => {
            const isSelected = selectedPlan === plan.id
            const isPopular = plan.popular

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card
                  className={`relative flex flex-col h-full cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-black'
                      : 'border-neutral-800 hover:border-neutral-700'
                  } bg-neutral-950`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-400 to-amber-300 text-amber-950 font-semibold">
                        Best Value
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-neutral-400">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        ${(plan.price / 100).toFixed(2)}
                      </span>
                      <p className="text-sm text-neutral-500 mt-1">one-time payment</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">{plan.credits} Credits</p>
                          <p className="text-sm text-neutral-400">
                            Download {plan.credits} {plan.credits === 1 ? 'resume' : 'resumes'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">No Expiration</p>
                          <p className="text-sm text-neutral-400">
                            Use your credits anytime
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">One-Time Payment</p>
                          <p className="text-sm text-neutral-400">
                            No subscription or hidden fees
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isLoading && isSelected}
                      className={`w-full ${
                        isSelected
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {isLoading && isSelected ? 'Processing...' : 'Get Credits'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-neutral-800 bg-neutral-950 p-8"
        >
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How long do credits last?</h3>
              <p className="text-neutral-400">
                Your credits never expire. Use them anytime to download PDF versions of your
                optimized resumes. You can purchase more credits whenever you need them.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I use credits across multiple resumes?</h3>
              <p className="text-neutral-400">
                Yes! Each credit represents one PDF download. Use your credits to download as many
                different resume versions as you need.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-neutral-400">
                We accept all major credit and debit cards through our secure Stripe payment
                processor. Your payment information is always encrypted and secure.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Is there a refund policy?</h3>
              <p className="text-neutral-400">
                Credits are non-refundable once purchased. However, if you experience any issues,
                please contact our support team and we'll be happy to help.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do I need a subscription?</h3>
              <p className="text-neutral-400">
                No subscriptions required! Pay once and get your credits. You only pay again if
                you want more credits in the future.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center text-neutral-500"
        >
          <p className="text-sm">
            🔒 Secure payments powered by Stripe • Your data is encrypted and protected
          </p>
        </motion.div>
      </div>
    </main>
  )
}
