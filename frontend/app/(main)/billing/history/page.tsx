'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, TrendingUp } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'

export default function BillingHistoryPage() {
  const router = useRouter()
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)

  const { data: creditsData } = trpc.billing.getUserCredits.useQuery()
  const { data: historyData, isLoading: isHistoryLoading } = trpc.billing.getBillingHistory.useQuery({
    limit,
    offset,
  })

  const transactions = historyData?.transactions || []
  const pagination = historyData?.pagination

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'deduction':
        return <Download className="h-5 w-5 text-blue-500" />
      case 'refund':
        return <Download className="h-5 w-5 text-purple-500" />
      default:
        return null
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-green-900 text-green-300">Purchase</Badge>
      case 'deduction':
        return <Badge className="bg-blue-900 text-blue-300">Used</Badge>
      case 'refund':
        return <Badge className="bg-purple-900 text-purple-300">Refund</Badge>
      default:
        return null
    }
  }

  const getReasonLabel = (reason?: string) => {
    if (!reason) return 'Unknown'
    if (reason.startsWith('stripe_checkout')) return 'Credit Purchase'
    if (reason === 'pdf_download') return 'PDF Download'
    return reason
  }

  const totalPurchased = transactions
    .filter((t) => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalUsed = Math.abs(
    transactions
      .filter((t) => t.type === 'deduction')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl font-semibold tracking-tight">Billing History</h1>
          <p className="text-neutral-400 mt-2">
            View your credit transactions and usage history
          </p>
        </motion.div>

        {/* Current Credits Summary */}
        {creditsData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-6 rounded-lg border border-neutral-800 bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Current Credit Balance</p>
                <p className="text-4xl font-bold mt-2">{creditsData.credits}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Total Purchased</p>
                <p className="text-2xl font-semibold mt-2 text-green-400">
                  {totalPurchased}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Total Used</p>
                <p className="text-2xl font-semibold mt-2 text-blue-400">
                  {totalUsed}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden"
        >
          <CardHeader className="border-b border-neutral-800">
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {isHistoryLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-t-white" />
                <p className="text-neutral-400 mt-4">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <p>No transactions yet. Start by purchasing credits!</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-6 flex items-center justify-between hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{getReasonLabel(transaction.reason)}</p>
                          {getTransactionBadge(transaction.type)}
                        </div>
                        <p className="text-sm text-neutral-400">
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy • hh:mm a')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-neutral-300'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </motion.div>

        {/* Pagination */}
        {pagination && pagination.total > limit && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex gap-2 justify-between items-center"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <p className="text-sm text-neutral-400">
              Showing {offset + 1} to {Math.min(offset + limit, pagination.total)} of {pagination.total}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={!pagination.hasMore}
            >
              Next
            </Button>
          </motion.div>
        )}

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400"
        >
          <p>
            💡 <strong>Note:</strong> Credits are non-refundable once used for PDF downloads. For billing questions or disputes, please contact our support team.
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex gap-3"
        >
          <Button
            onClick={() => router.push('/billing')}
            className="flex-1 bg-white text-black hover:bg-neutral-200"
            size="lg"
          >
            Get More Credits
          </Button>
        </motion.div>
      </div>
    </main>
  )
}
