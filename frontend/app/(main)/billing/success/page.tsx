'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

export default function BillingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'timeout'>('loading')
  const [pollCount, setPollCount] = useState(0)

  // ✅ Query for payment status (checks local DB, not Stripe)
  const getPaymentStatusQuery = trpc.billing.getPaymentStatus.useQuery(
    { sessionId: sessionId || '' },
    { enabled: false } // Manually control polling
  )

  // ✅ Only refetch credits AFTER payment is confirmed (don't run on initial load)
  const refetchCreditsQuery = trpc.billing.getUserCredits.useQuery(
    {},
    { enabled: false } // Disabled until payment confirmed
  )

  useEffect(() => {
    if (!sessionId) {
      console.error('❌ No session ID provided')
      setStatus('error')
      return
    }

    // ✅ Debug: Check if JWT token is available
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    console.log('🔐 JWT Token available:', !!token, token ? `${token.substring(0, 20)}...` : 'MISSING')

    console.log('🎯 Starting payment verification for session:', sessionId)

    // ✅ Configuration
    const MAX_POLL_ATTEMPTS = 240 // 120 seconds (500ms * 240) - increased from 30s to allow webhook processing
    const POLL_INTERVAL = 500 // 500ms

    let pollCount = 0
    let pollTimer: NodeJS.Timeout | null = null

    const startPolling = async () => {
      pollTimer = setInterval(async () => {
        pollCount++
        setPollCount(pollCount)

        try {
          console.log(`🔄 POLL #${pollCount}: Checking payment status...`)

          // ✅ Call NEW endpoint that checks local DB, not Stripe
          const statusResult = await getPaymentStatusQuery.refetch()

          if (statusResult.data?.status === 'confirmed') {
            // ✅ Local DB confirms payment (webhook has completed)
            console.log('✅ Payment confirmed! Credits added:', statusResult.data.creditsAdded)

            // ✅ Refetch credits to show updated amount
            try {
              await refetchCreditsQuery.refetch()
            } catch (creditsError) {
              console.warn('Failed to refetch credits, but payment confirmed:', creditsError)
            }
            setStatus('success')

            if (pollTimer) clearInterval(pollTimer)

            // Auto-redirect after 3 seconds
            setTimeout(() => {
              console.log('🚀 Redirecting to /analyze')
              router.push('/analyze')
            }, 3000)
          } else if (pollCount >= MAX_POLL_ATTEMPTS) {
            // ✅ Timeout after 30 seconds
            console.error('❌ Payment verification timeout after 30 seconds')
            setStatus('timeout')
            if (pollTimer) clearInterval(pollTimer)
          } else {
            // Still pending, continue polling
            console.log(`⏳ Payment still processing... (${pollCount}/${MAX_POLL_ATTEMPTS})`)
          }
        } catch (error: any) {
          // ✅ Handle specific error codes
          const errorCode = error?.data?.code

          // Don't retry on auth errors - just show error
          if (errorCode === 'UNAUTHORIZED') {
            console.error('❌ Authentication failed:', error.message)
            setStatus('error')
            if (pollTimer) clearInterval(pollTimer)
            return
          }

          // For other errors, continue polling until timeout
          console.warn(`⚠️ Payment status check error (attempt ${pollCount}/${MAX_POLL_ATTEMPTS}):`, error.message)

          if (pollCount >= MAX_POLL_ATTEMPTS) {
            setStatus('error')
            if (pollTimer) clearInterval(pollTimer)
          }
        }
      }, POLL_INTERVAL)
    }

    startPolling()

    // ✅ Cleanup function to clear the polling interval
    return () => {
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [sessionId]) // ✅ Only depend on sessionId to prevent re-mounting polling

  return (
    <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-blue-500" />
            <h1 className="text-3xl font-semibold mb-2">Verifying Your Payment</h1>
            <p className="text-neutral-400 mb-4">
              Please wait while we confirm your payment and add your credits...
            </p>
            <p className="text-sm text-neutral-500">
              Poll attempt: {pollCount}/240 ({(pollCount * 500 / 1000).toFixed(1)}s of 120s)
            </p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="border-green-700/30 bg-green-900/10">
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mb-6"
                >
                  <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                </motion.div>

                <h1 className="text-4xl font-semibold text-green-300 mb-2">
                  Payment Successful!
                </h1>
                <p className="text-neutral-300 mb-6">
                  Your credits have been added to your account. You can now download your optimized
                  resumes.
                </p>

                {refetchCreditsQuery.data && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 p-4 rounded-lg bg-neutral-900 border border-neutral-800"
                  >
                    <p className="text-sm text-neutral-400 mb-1">Your Credits</p>
                    <p className="text-3xl font-bold text-yellow-500">
                      {refetchCreditsQuery.data.credits}
                    </p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-neutral-500">
                    Redirecting you to the app in 3 seconds...
                  </p>
                  <Button
                    onClick={() => router.push('/analyze')}
                    className="w-full bg-white text-black hover:bg-neutral-200"
                    size="lg"
                  >
                    Go to App
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {status === 'timeout' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="border-yellow-700/30 bg-yellow-900/10">
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mb-6"
                >
                  <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </motion.div>

                <h1 className="text-3xl font-semibold text-yellow-300 mb-2">
                  Still Verifying Payment
                </h1>
                <p className="text-neutral-300 mb-6">
                  Your payment is taking longer than expected to verify. This is normal - your credits will be added shortly.
                  You can close this window safely.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => refetchCreditsQuery.refetch().then(() => router.push('/analyze'))}
                    className="w-full bg-white text-black hover:bg-neutral-200"
                    size="lg"
                  >
                    Continue to App
                  </Button>
                  <Button
                    onClick={() => router.push('/billing')}
                    variant="outline"
                    className="w-full border-neutral-700 text-neutral-300"
                    size="lg"
                  >
                    Check Billing Status
                  </Button>
                </div>

                <p className="text-xs text-yellow-600 mt-6">
                  💡 Credits will be added within a few minutes. If not, contact support.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="border-red-700/30 bg-red-900/10">
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mb-6"
                >
                  <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                </motion.div>

                <h1 className="text-4xl font-semibold text-red-300 mb-2">
                  Payment Could Not Be Verified
                </h1>
                <p className="text-neutral-300 mb-6">
                  We couldn't verify your payment. Your card may not have been charged. Please try
                  again or contact support if you continue to experience issues.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/billing')}
                    className="w-full bg-white text-black hover:bg-neutral-200"
                    size="lg"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => router.push('/analyze')}
                    variant="outline"
                    className="w-full border-neutral-700 text-neutral-300"
                    size="lg"
                  >
                    Back to App
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  )
}
