'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { ResumeTemplate, type ResumeData } from '@/components/ResumeTemplate'
import { useResumeGeneration } from '@/providers/resume-generation-provider'
import { mapResumeToTemplate, getTemplateInfo } from '@/lib/template-mapper'
import { toast } from 'sonner'

export default function ResumePreviewPage() {
  const router = useRouter()
  const resumeRef = useRef<HTMLDivElement>(null)
  const { generatedResumeData, selectedTemplate } = useResumeGeneration()
  const [mounted, setMounted] = useState(false)

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

  // Sanitize and map data to selected template
  const sanitizedData = JSON.parse(JSON.stringify(generatedResumeData)); // Deep copy

  if (sanitizedData.experience) {
    sanitizedData.experience.forEach((exp: any) => {
      if (Array.isArray(exp.description)) {
        exp.description = exp.description.join('\\n');
      }
    });
  }

  if (sanitizedData.projects) {
    sanitizedData.projects.forEach((proj: any) => {
      if (Array.isArray(proj.description)) {
        proj.description = proj.description.join('\\n');
      }
    });
  }

  const mappedData = mapResumeToTemplate(sanitizedData, selectedTemplate)
  const templateInfo = getTemplateInfo(selectedTemplate)

  const handleDownload = () => {
    router.push('/resume/export')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
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
          <h1 className="text-3xl font-semibold tracking-tight">Resume Preview</h1>
          <p className="text-neutral-500 mt-2">
            Review your optimized resume with the selected template
          </p>
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <div className="px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-700/50 text-sm text-blue-300">
            {templateInfo.name} Template Selected
          </div>

          <div className="flex-1" />

          <Button
            onClick={handleDownload}
            className="bg-white text-black hover:bg-neutral-200"
          >
            Download & Export
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        {/* Resume Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 mb-8"
        >
          {/* Template Badge */}
          <div className="mb-6 flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-sm text-blue-300">
              {templateInfo.name}
            </div>
            <div className="text-xs text-neutral-500">Professional & ATS-Optimized</div>
          </div>

          {/* Resume Preview Area */}
          <div
            className="overflow-auto bg-white rounded-lg p-0"
            style={{
              maxHeight: '800px',
              border: '1px solid #e5e7eb',
            }}
          >
            <ResumeTemplate ref={resumeRef} data={mappedData} templateName="faang-path" />
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400">
            <p>
              ✓ This template is optimized for ATS systems. Your content has been automatically
              mapped and formatted for maximum readability by both humans and automated scanners.
            </p>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 gap-4"
        >

          <Card className="border-green-700/30 bg-green-900/10">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Ready to Download</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Your resume is ready to download as a PDF. Proceed to the final confirmation.
              </p>
              <Button
                onClick={handleDownload}
                className="w-full bg-white text-black hover:bg-neutral-200"
              >
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
