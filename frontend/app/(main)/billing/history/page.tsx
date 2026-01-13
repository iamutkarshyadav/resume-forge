'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Crown, CheckCircle2, XCircle, Clock } from 'lucide-react'
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

  const getStatusIcon = (type: string) => {
    if (type === 'purchase') return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return <Clock className="h-4 w-4 text-white" />
  }

  const getStatusColor = (type: string) => {
    if (type === 'purchase') return 'text-green-500'
    if (type === 'deduction') return 'text-white'
    return 'text-neutral-400'
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-semibold tracking-tight">Billing History</h1>
          <p className="text-neutral-400 mt-2">
            View your credit transactions and usage history
          </p>
        </div>

        {/* Current Credits Summary */}
        {creditsData && (
          <div className="mb-12 p-6 border border-neutral-800 bg-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Current Credit Balance</p>
                <div className="flex items-center gap-2 mt-2">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  <p className="text-4xl font-bold text-yellow-500">{creditsData.credits}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Total Purchased</p>
                <p className="text-2xl font-semibold mt-2 text-white">
                  {totalPurchased}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Total Used</p>
                <p className="text-2xl font-semibold mt-2 text-white">
                  {totalUsed}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="border border-neutral-800 bg-black overflow-hidden">
          <div className="border-b border-neutral-800 p-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>

          <div>
            {isHistoryLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
                <p className="text-neutral-400 mt-4">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <p>No transactions yet. Start by purchasing credits!</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Credits</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <p className="text-sm text-white">
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {format(new Date(transaction.createdAt), 'hh:mm a')}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-white">{getReasonLabel(transaction.reason)}</p>
                        {transaction.metadata?.planId && (
                          <p className="text-xs text-neutral-500 mt-1">Plan: {transaction.metadata.planId.charAt(0).toUpperCase() + transaction.metadata.planId.slice(1)}</p>
                        )}
                        {transaction.metadata?.currency && (
                          <p className="text-xs text-neutral-500 mt-1">
                            ${((transaction.metadata?.amount || 0) / 100).toFixed(2)} {transaction.metadata.currency.toUpperCase()}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className={`text-lg font-semibold ${getStatusColor(transaction.type)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.type)}
                          <span className={`text-sm ${
                            transaction.type === 'purchase' ? 'text-green-500' : 'text-neutral-400'
                          }`}>
                            {transaction.type === 'purchase' ? 'Paid' : 'Processed'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {transaction.metadata?.stripePaymentIntentId ? (
                          <div>
                            <p className="text-xs text-neutral-500 font-mono">
                              {transaction.metadata.stripePaymentIntentId.slice(-12)}
                            </p>
                            <p className="text-xs text-neutral-600 mt-1">Stripe</p>
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500">—</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > limit && (
          <div className="mt-6 flex gap-2 justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="cursor-pointer border-neutral-800"
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
              className="cursor-pointer border-neutral-800"
            >
              Next
            </Button>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8">
          <Button
            onClick={() => router.push('/billing')}
            className="w-full bg-white text-black hover:bg-neutral-200 cursor-pointer"
            size="lg"
          >
            Get More Credits
          </Button>
        </div>
      </div>
    </main>
  )
}
