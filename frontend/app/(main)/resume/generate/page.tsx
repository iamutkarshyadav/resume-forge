'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useErrorHandler } from '@/providers/error-provider'
import { toast } from 'sonner'
import { useResumeGeneration } from '@/providers/resume-generation-provider'


type ProgressStep = 'parsing' | 'matching' | 'rewriting' | 'finalizing' | 'complete' | 'error'

const STEP_LABELS: Record<ProgressStep, string> = {
  parsing: 'Parsing your resume',
  matching: 'Matching with job description',
  rewriting: 'Rewriting content for ATS',
  finalizing: 'Finalizing resume',
  complete: 'Generation complete',
  error: 'Generation failed',
}

const STEP_DESCRIPTIONS: Record<ProgressStep, string> = {
  parsing: 'Extracting structured data from your original resume',
  matching: 'Analyzing job description to identify key requirements',
  rewriting: 'Tailoring content with relevant keywords and metrics',
  finalizing: 'Building optimized resume structure',
  complete: 'Your resume is ready for template selection',
  error: 'There was an issue generating your resume',
}

export default function ResumeGeneratePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showErrorFromException } = useErrorHandler()
  const { setGeneratedResumeData } = useResumeGeneration();
  const ctx = (trpc as any).useUtils();


  const [currentStep, setCurrentStep] = useState<ProgressStep>('parsing')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const generateMutation = (trpc as any).match.generateResumeForJD.useMutation()

  // Get parameters and trigger generation
  useEffect(() => {
    setMounted(true)

    const resumeId = searchParams.get('resumeId')
    const jdId = searchParams.get('jdId')

    if (!resumeId || !jdId) {
      setError('Missing resume ID or job description ID')
      setCurrentStep('error')
      toast.error('Missing resume ID or job description ID');
      router.push('/analyze');
      return
    }

    // Trigger generation
    const triggerGeneration = async () => {
      try {
        // Visual progress (brief delays for UX)
        setCurrentStep('parsing')
        await new Promise((resolve) => setTimeout(resolve, 500))
        setCurrentStep('matching')
        await new Promise((resolve) => setTimeout(resolve, 500))
        setCurrentStep('rewriting')

        // 1. Trigger Job
        const response = await generateMutation.mutateAsync({
          resumeId,
          jdId,
        })

        if (!(response as any).jobId) {
          throw new Error('Failed to start resume generation job')
        }

        const jobId = (response as any).jobId
        
        // 2. Poll for Status
        setCurrentStep('finalizing')
        
        let attempts = 0;
        const maxAttempts = 40; // 80 seconds

        const pollJob = async (): Promise<any> => {
           if (attempts >= maxAttempts) throw new Error("Generation timed out");
           
           await new Promise(r => setTimeout(r, 2000));
           attempts++;
           
           const job = await ctx.job.getJobStatus.fetch({ jobId });
           
           if (job.status === "completed") return job.result;
           if (job.status === "failed") throw new Error(job.error || "Generation failed");
           
           return pollJob();
        }

        const jobResult = await pollJob();
        const generatedData = jobResult?.generated || jobResult?.match?.generatedResume

        if (!generatedData) {
          throw new Error('Generated data missing in job result')
        }
        
        // Store the generated data in the provider for the template selection page
        setGeneratedResumeData(generatedData);
        
        // Mark as complete
        setCurrentStep('complete')

        // Navigate to templates page after a brief delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
        router.push('/resume/templates')
      } catch (err) {
        console.error('Generation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate resume')
        setCurrentStep('error')
        showErrorFromException(err, 'Resume Generation Failed')
      }
    }

    triggerGeneration()
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) {
    return null
  }

  const steps: ProgressStep[] = ['parsing', 'matching', 'rewriting', 'finalizing']
  const currentStepIndex = steps.indexOf(currentStep)

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
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
          <h1 className="text-3xl font-semibold tracking-tight">Generating Your Resume</h1>
          <p className="text-neutral-500 mt-2">
            Our AI is optimizing your resume for this specific job. This usually takes 30-60 seconds.
          </p>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
            <CardContent className="p-8">
              {/* Steps */}
              <div className="space-y-6 mb-8">
                {steps.map((step, idx) => {
                  const isActive = currentStepIndex === idx
                  const isComplete = currentStepIndex > idx
                  const isFailed = currentStep === 'error'

                  return (
                    <div key={step}>
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                          isActive
                            ? 'bg-blue-500/10 border border-blue-500/30'
                            : isComplete
                            ? 'bg-green-500/10 border border-green-500/30'
                            : 'bg-neutral-900 border border-neutral-800'
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isActive ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            >
                              <Loader2
                                className={`h-5 w-5 ${
                                  isActive ? 'text-blue-400' : 'text-neutral-600'
                                }`}
                              />
                            </motion.div>
                          ) : isComplete ? (
                            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-xs text-white">✓</span>
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-neutral-800" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <p
                            className={`font-semibold transition-colors ${
                              isActive
                                ? 'text-blue-300'
                                : isComplete
                                ? 'text-green-300'
                                : 'text-neutral-400'
                            }`}
                          >
                            {STEP_LABELS[step]}
                          </p>
                          <p className="text-sm text-neutral-500 mt-1">
                            {STEP_DESCRIPTIONS[step]}
                          </p>
                        </div>
                      </motion.div>

                      {/* Connector Line */}
                      {idx < steps.length - 1 && (
                        <div className="ml-2.5 h-3 w-0.5 bg-gradient-to-b from-neutral-700 to-neutral-800" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Error State */}
              {currentStep === 'error' && error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 rounded-lg bg-red-900/10 border border-red-700/30 flex gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-300">Generation Failed</p>
                    <p className="text-sm text-red-200 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Info Box */}
              <div className="mt-8 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400">
                <p>
                  💡 Our AI analyzes the job description and tailors your resume with relevant keywords,
                  metrics, and achievements to improve your ATS match score.
                </p>
              </div>

              {/* Action Buttons */}
              {currentStep === 'error' && (
                <div className="mt-8 flex gap-3">
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="border-neutral-700 text-neutral-300"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep('parsing')
                      setError(null)
                      window.location.reload()
                    }}
                    className="bg-white text-black hover:bg-neutral-200"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
