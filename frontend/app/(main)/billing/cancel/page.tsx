'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ArrowLeft } from 'lucide-react'

export default function BillingCancelPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Card className="border-neutral-700 bg-neutral-950">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto">
                  <X className="h-8 w-8 text-neutral-400" />
                </div>
              </motion.div>

              <h1 className="text-4xl font-semibold text-neutral-300 mb-2">
                Payment Cancelled
              </h1>
              <p className="text-neutral-400 mb-8">
                Your payment was cancelled. You were not charged. Feel free to try again whenever you're ready.
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
                  onClick={() => router.back()}
                  variant="outline"
                  className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>

              <p className="text-xs text-neutral-500 mt-8">
                No charges have been made to your account.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
