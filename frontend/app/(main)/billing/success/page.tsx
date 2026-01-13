'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
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
  
  // State: Explicit State Machine
  const [viewState, setViewState] = useState<'VERIFYING' | 'VERIFIED' | 'PENDING' | 'FAILED'>('VERIFYING')
  const [errorMessage, setErrorMessage] = useState<string>("")
  
  const utils = trpc.useUtils()
  
  // The Single Source of Truth Mutation
  const verifyMutation = trpc.billing.verifyPayment.useMutation({
    onSuccess: async (data) => {
        if (data.status === 'VERIFIED') {
            setViewState('VERIFIED');
            toast.success(`Payment verified! ${data.credits} credits added.`);
            
            // Refresh global state
            await Promise.all([
                utils.billing.getUserCredits.invalidate(),
                utils.plan.getMetrics.invalidate()
            ]);
            
            // Redirect
            setTimeout(() => router.push('/analyze'), 3000);

        } else if (data.status === 'PENDING') {
            setViewState('PENDING');
        }
    },
    onError: (error) => {
        setViewState('FAILED');
        setErrorMessage(error.message || "Verification failed");
    }
  });

  // Effect: Run ONCE on mount
  const hasRun = useRef(false);
  useEffect(() => {
    if (!sessionId) {
        setViewState('FAILED');
        setErrorMessage("Missing session ID");
        return;
    }

    if (!hasRun.current) {
        hasRun.current = true;
        verifyMutation.mutate({ sessionId });
    }
  }, [sessionId]);

  const handleManualRetry = () => {
    if (!sessionId) return;
    setViewState('VERIFYING'); // Show loading spinner again
    verifyMutation.mutate({ sessionId });
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        
        {/* STATE: VERIFYING */}
        {viewState === 'VERIFYING' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-semibold mb-2">Verifying Payment...</h1>
            <p className="text-muted-foreground">
              Contacting payment provider safety check...
            </p>
          </motion.div>
        )}

        {/* STATE: VERIFIED */}
        {viewState === 'VERIFIED' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-4xl font-semibold text-green-700 dark:text-green-400 mb-2">
                  Payment Confirmed
                </h1>
                <p className="text-muted-foreground mb-6">
                  Secure verification complete. Adding credits...
                </p>
                <Button onClick={() => router.push('/analyze')} className="w-full" size="lg">
                  Continue to App
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STATE: PENDING */}
        {viewState === 'PENDING' && (
           <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
           >
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="p-12 text-center">
                <Clock className="h-16 w-16 text-yellow-600 dark:text-yellow-500 mx-auto mb-6" />
                <h1 className="text-3xl font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                  Payment Processing
                </h1>
                <p className="text-muted-foreground mb-6">
                  The payment provider is still processing this transaction. This can happen with certain banking methods.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={handleManualRetry} 
                    className="w-full" 
                    size="lg"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? "Checking..." : "Check Status Again"}
                  </Button>
                  <Button onClick={() => router.push('/analyze')} variant="outline" className="w-full">
                    Check Later
                  </Button>
                </div>
              </CardContent>
            </Card>
           </motion.div>
        )}

        {/* STATE: FAILED */}
        {viewState === 'FAILED' && (
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-6" />
                <h1 className="text-3xl font-semibold text-red-700 dark:text-red-400 mb-2">
                  Verification Failed
                </h1>
                <p className="text-muted-foreground mb-6">
                  {errorMessage}
                </p>
                <div className="space-y-3">
                    <Button onClick={handleManualRetry} className="w-full">Try Again</Button>
                    <Button onClick={() => router.push('/billing')} variant="outline" className="w-full">
                        Return to Billing
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