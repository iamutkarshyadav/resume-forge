'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2, Check, AlertCircle } from 'lucide-react'
import { ResumeTemplate, type ResumeData } from '@/components/ResumeTemplate'
import { useResumeGeneration } from '@/providers/resume-generation-provider'
import { mapResumeToTemplate, getTemplateInfo } from '@/lib/template-mapper'
import { BillingModal } from '@/components/BillingModal'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

export default function ResumeExportPage() {
  const router = useRouter()
  const resumeRef = useRef<HTMLDivElement>(null)
  const { generatedResumeData, selectedTemplate } = useResumeGeneration()
  const [mounted, setMounted] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [billingModalOpen, setBillingModalOpen] = useState(false)

  // Fetch user credits and eligibility
  const creditsQuery = trpc.billing.getUserCredits.useQuery()
  const eligibilityQuery = trpc.pdf.checkDownloadEligibility.useQuery()
  const generatePdfMutation = trpc.pdf.generateAndDownloadPDF.useMutation()

  React.useEffect(() => {
    setMounted(true)

    // Validate state
    if (!generatedResumeData || !selectedTemplate) {
      toast.error('Missing resume data. Please start from the beginning.')
      router.push('/analyze')
    }
  }, [])

  if (!mounted || !generatedResumeData || !selectedTemplate) {
    return null
  }

  const mappedData = mapResumeToTemplate(generatedResumeData, selectedTemplate)
  const templateInfo = getTemplateInfo(selectedTemplate)

  const handleDownloadPDF = async () => {
    // Check if user has credits
    if (!eligibilityQuery.data || !eligibilityQuery.data.canDownload) {
      setBillingModalOpen(true)
      return
    }

    if (!generatedResumeData) {
      toast.error('Resume data not found')
      return
    }

    setExporting(true)
    try {
      const fileName = `Resume_${generatedResumeData.name.replace(/\s+/g, '_')}.pdf`
      toast.loading('Generating PDF...', { id: 'pdf-export' })

      // Call server-side PDF generation with credit deduction
      const result = await generatePdfMutation.mutateAsync({
        resumeData: generatedResumeData,
        fileName: fileName,
      })

      if (result.success && result.pdfBase64) {
        // Decode base64 to blob and download
        const binaryString = window.atob(result.pdfBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // Dismiss loading toast and show success
        toast.dismiss('pdf-export')
        toast.success(`${fileName} downloaded successfully`)
        setExported(true)

        // Refetch credits to update UI
        await creditsQuery.refetch()
        await eligibilityQuery.refetch()
      }
    } catch (error: any) {
      console.error('PDF export error:', error)
      toast.dismiss('pdf-export')

      // Check if it's a credit error
      if (error.data?.code === 'PRECONDITION_FAILED') {
        setBillingModalOpen(true)
        toast.error('Insufficient credits. Please purchase more.')
      } else {
        toast.error(error.message || 'Failed to export PDF. Please try again.')
      }
    } finally {
      setExporting(false)
    }
  }

  const handleStartNew = () => {
    // Reset flow and go back to analyze
    router.push('/analyze')
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
          <h1 className="text-3xl font-semibold tracking-tight">Ready to Download</h1>
          <p className="text-neutral-500 mt-2">
            Your optimized resume is ready. Download it now or review the preview below.
          </p>
        </motion.div>

        {/* Success Banner */}
        {exported && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-lg bg-green-900/10 border border-green-700/30 flex gap-3"
          >
            <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-300">Download Complete!</p>
              <p className="text-sm text-green-200 mt-0.5">
                Your resume has been successfully downloaded. You can now upload it to job applications.
              </p>
            </div>
          </motion.div>
        )}

        {/* Confirmation Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-8 rounded-2xl bg-neutral-950 border border-neutral-800"
        >
          <h2 className="text-xl font-semibold mb-6">Final Confirmation</h2>

          <div className="space-y-4 mb-8">
            {/* Resume Info */}
            <div className="flex items-start justify-between p-4 rounded-lg bg-neutral-900">
              <div>
                <p className="text-sm font-semibold text-neutral-300">Candidate Name</p>
                <p className="text-lg text-white mt-1">{generatedResumeData.name}</p>
              </div>
            </div>

            {/* Template Info */}
            <div className="flex items-start justify-between p-4 rounded-lg bg-neutral-900">
              <div>
                <p className="text-sm font-semibold text-neutral-300">Selected Template</p>
                <p className="text-lg text-white mt-1">{templateInfo.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Structure</p>
                <p className="text-sm text-neutral-400 mt-1">{templateInfo.useCase}</p>
              </div>
            </div>

            {/* ATS Optimization */}
            <div className="flex items-start justify-between p-4 rounded-lg bg-blue-900/10 border border-blue-700/30">
              <div>
                <p className="text-sm font-semibold text-blue-300">ATS Optimization</p>
                <p className="text-sm text-neutral-400 mt-1">This resume is formatted for maximum ATS compatibility</p>
              </div>
              <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={handleDownloadPDF}
            disabled={exporting || exported}
            className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed h-12 rounded-lg font-semibold text-lg"
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : exported ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Downloaded Successfully
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </motion.div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-xl font-semibold mb-6">Preview</h2>

          {/* Resume Template */}
          <div
            className="overflow-auto bg-white rounded-lg p-0"
            style={{
              maxHeight: '600px',
              border: '1px solid #e5e7eb',
            }}
          >
            <ResumeTemplate ref={resumeRef} data={mappedData} templateName="faang-path" />
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400">
            <p>
              ✓ Your resume has been formatted for optimal display in both digital and applicant tracking
              systems. The PDF will maintain all formatting and is ready to submit to employers.
            </p>
          </div>
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-6 rounded-2xl bg-neutral-900 border border-neutral-800"
        >
          <h3 className="font-semibold mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              <span>Upload your optimized resume to job application portals</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              <span>Customize this resume for different job descriptions as needed</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              <span>Track your applications and monitor your success rate</span>
            </li>
          </ul>
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
            onClick={handleStartNew}
            className="flex-1 bg-white text-black hover:bg-neutral-200"
          >
            Analyze Another Job
          </Button>
        </motion.div>

        {/* Billing Modal */}
        <BillingModal
          open={billingModalOpen}
          onOpenChange={setBillingModalOpen}
          currentCredits={creditsQuery.data?.credits || 0}
          creditsNeeded={1}
        />
      </div>
    </main>
  )
}
