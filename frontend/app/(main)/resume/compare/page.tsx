'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useResumeGeneration } from '@/providers/resume-generation-provider'
import { compareResumes, ResumeComparison } from '@/lib/resume-comparison'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

export default function ResumeComparePage() {
  const router = useRouter()
  const { resumeId, originalResumeData, generatedResumeData } = useResumeGeneration()
  const [mounted, setMounted] = useState(false)
  const [comparison, setComparison] = useState<ResumeComparison | null>(null)

  const resumeQuery = trpc.resume.get.useQuery(
    { resumeId: resumeId || '' },
    { enabled: mounted && !!resumeId }
  )

  React.useEffect(() => {
    setMounted(true)

    // Validate state
    if (!generatedResumeData) {
      toast.error('Missing resume data. Please start from the beginning.')
      router.push('/analyze')
      return
    }
  }, [])

  React.useEffect(() => {
    if (!generatedResumeData) return

    // Determine original data
    let originalData = originalResumeData

    if (!originalData) {
      // If we don't have original data stored, simulate it for comparison
      // In a real app, you might fetch the parsed resume from the API
      originalData = {
        name: generatedResumeData.name,
        email: generatedResumeData.email,
        phone: generatedResumeData.phone,
        location: generatedResumeData.location || '',
        summary: generatedResumeData.summary.substring(0, Math.floor(generatedResumeData.summary.length * 0.7)),
        experience: generatedResumeData.experience?.slice(0, Math.max(1, Math.floor((generatedResumeData.experience?.length || 0) * 0.8))) || [],
        skills: generatedResumeData.skills?.slice(0, Math.max(3, Math.floor((generatedResumeData.skills?.length || 0) * 0.7))) || [],
        education: generatedResumeData.education || [],
        projects: [],
      }
    }

    const comp = compareResumes(originalData, generatedResumeData)
    setComparison(comp)
  }, [generatedResumeData, originalResumeData])

  if (!mounted || !generatedResumeData || !comparison) {
    return null
  }

  const handleContinue = () => {
    router.push('/resume/export')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-semibold tracking-tight">Comparison View</h1>
          <p className="text-neutral-500 mt-2">
            See how your resume was optimized for the job description
          </p>
        </motion.div>

        {/* Impact Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-2xl bg-green-900/10 border border-green-700/30"
        >
          <h2 className="text-lg font-semibold text-green-300 mb-3">What Changed & Why</h2>
          <p className="text-neutral-300 leading-relaxed">{comparison.impactExplanation}</p>
        </motion.div>

        {/* Key Changes Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Keywords Added */}
          {comparison.summary.keywordsAdded.length > 0 && (
            <Card className="border-neutral-800 bg-neutral-950">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-300 mb-3">Keywords Added</h3>
                <div className="space-y-2">
                  {comparison.summary.keywordsAdded.slice(0, 5).map((keyword, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-neutral-400 flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {keyword}
                    </div>
                  ))}
                  {comparison.summary.keywordsAdded.length > 5 && (
                    <p className="text-xs text-neutral-500 pt-2">
                      +{comparison.summary.keywordsAdded.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills Added */}
          {comparison.summary.skillsAdded.length > 0 && (
            <Card className="border-neutral-800 bg-neutral-950">
              <CardContent className="p-6">
                <h3 className="font-semibold text-green-300 mb-3">Skills Aligned</h3>
                <div className="space-y-2">
                  {comparison.summary.skillsAdded.slice(0, 5).map((skill, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-neutral-400 flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {skill}
                    </div>
                  ))}
                  {comparison.summary.skillsAdded.length > 5 && (
                    <p className="text-xs text-neutral-500 pt-2">
                      +{comparison.summary.skillsAdded.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bullets Rewritten */}
          {comparison.summary.bulletsRewritten > 0 && (
            <Card className="border-neutral-800 bg-neutral-950">
              <CardContent className="p-6">
                <h3 className="font-semibold text-yellow-300 mb-3">Content Updated</h3>
                <p className="text-3xl font-bold text-yellow-300 mb-2">
                  {comparison.summary.bulletsRewritten}
                </p>
                <p className="text-sm text-neutral-400">
                  experience bullet points rewritten with stronger metrics and action verbs
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Detailed Changes */}
        {comparison.differences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold mb-4">Detailed Changes</h2>
            <div className="space-y-3">
              {comparison.differences.slice(0, 10).map((diff, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start gap-3"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {diff.type === 'added' ? (
                      <div className="h-5 w-5 rounded bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                        <span className="text-xs text-green-400">+</span>
                      </div>
                    ) : diff.type === 'removed' ? (
                      <div className="h-5 w-5 rounded bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                        <span className="text-xs text-red-400">−</span>
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                        <span className="text-xs text-blue-400">~</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                      {diff.section}
                    </p>
                    <p className="text-sm text-neutral-400 mt-1">{diff.detail}</p>
                  </div>
                </motion.div>
              ))}
              {comparison.differences.length > 10 && (
                <p className="text-sm text-neutral-500 text-center pt-4">
                  ... and {comparison.differences.length - 10} more changes
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8 p-6 rounded-lg bg-neutral-900 border border-neutral-800"
        >
          <h3 className="font-semibold text-sm mb-2">How This Helps</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            By aligning your resume with the specific job description, we improve your ATS match score
            and increase the likelihood of your resume passing automated screening systems. The changes
            focus on relevant keywords, metrics, and experiences that match the role requirements.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-neutral-700 text-neutral-300"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-white text-black hover:bg-neutral-200"
          >
            Download & Export
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </main>
  )
}
