'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Check, ChevronRight } from 'lucide-react'
import { useResumeGeneration, TemplateType } from '@/providers/resume-generation-provider'
import { getAllTemplates } from '@/lib/template-mapper'
import { toast } from 'sonner'

export default function ResumeTemplatesPage() {
  const router = useRouter()
  const { generatedResumeData, selectedTemplate, setSelectedTemplate } = useResumeGeneration()
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)

    // Validate that we have generated data
    if (!generatedResumeData) {
      toast.error('No generated resume found. Please start from the beginning.')
      router.push('/analyze')
    }
  }, [])

  if (!mounted || !generatedResumeData) {
    return null
  }

  const templates = getAllTemplates()

  const handleSelectTemplate = (templateId: TemplateType) => {
    setSelectedTemplate(templateId)
  }

  const handleContinue = () => {
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }
    router.push('/resume/preview')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
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
          <h1 className="text-3xl font-semibold tracking-tight">Choose Your Template</h1>
          <p className="text-neutral-500 mt-2">
            Select a template structure that best fits your target role. All templates are ATS-optimized.
          </p>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleSelectTemplate(template.id as TemplateType)}
            >
              <Card
                className={`rounded-2xl cursor-pointer transition-all transform hover:scale-105 ${
                  selectedTemplate === template.id
                    ? 'border-2 border-green-500 bg-green-900/10'
                    : 'border border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <p className="text-xs text-neutral-400 mt-1">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Use Case */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                      Best For
                    </p>
                    <p className="text-sm text-neutral-400 mt-1">{template.useCase}</p>
                  </div>

                  {/* Sections */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                      Includes
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(template.sections).map(([key, included]) =>
                        included ? (
                          <div
                            key={key}
                            className="text-xs text-neutral-400 flex items-center gap-2"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  {template.atsOptimized && (
                    <div className="mt-4 inline-block px-2.5 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-xs text-blue-300">
                      ATS Optimized
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-lg bg-neutral-900 border border-neutral-800"
        >
          <h3 className="font-semibold text-sm mb-2">About Templates</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            All templates are <strong>structurally optimized for ATS parsing</strong> and designed to pass
            automated screening systems. The selection is about <strong>content organization</strong>, not
            visual design. Choose the template that best highlights your strengths for the target role.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex gap-3"
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
            disabled={!selectedTemplate}
            className="flex-1 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Preview
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </main>
  )
}
