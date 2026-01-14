'use client'

import React, { useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useResumeGeneration } from '@/providers/resume-generation-provider'
// Import from shared package
import { 
  mapToAST, 
  resolveLayout, 
  DEFAULT_TEMPLATE_RULES,
  LegacyResumeData
} from '@resume-forge/shared'
import { toast } from 'sonner'

// Dynamically import ResumeHTML to avoid SSR issues if it uses browser-only features
// Though it's standard HTML, we keep it dynamic for consistency with modern Next.js patterns
const ResumeHTML = dynamic(
  () => import('@resume-forge/shared').then((mod) => mod.ResumeHTML),
  {
    ssr: false,
    loading: () => <div className="h-[800px] w-full bg-white flex items-center justify-center text-neutral-400">Loading Resume...</div>,
  }
)

import { RESUME_STYLES } from '@resume-forge/shared';

export default function ResumePreviewPage() {
  const router = useRouter()
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

  // Memoize the layout resolution to avoid re-calculating on every render
  const { layout, meta } = useMemo(() => {
    if (!generatedResumeData) return { layout: null, meta: null }
    
    // Convert legacy data to AST
    const dataForAST = {
      ...generatedResumeData,
      experience: Array.isArray(generatedResumeData.experience) ? generatedResumeData.experience : [],
      projects: Array.isArray(generatedResumeData.projects) ? generatedResumeData.projects : [],
      skills: generatedResumeData.skills || [],
      education: Array.isArray(generatedResumeData.education) ? generatedResumeData.education : []
    };

    const ast = mapToAST(dataForAST as unknown as LegacyResumeData, DEFAULT_TEMPLATE_RULES)
    const resolved = resolveLayout(ast, DEFAULT_TEMPLATE_RULES)
    
    return { layout: resolved, meta: resolved.meta }
  }, [generatedResumeData])

  if (!mounted || !generatedResumeData || !selectedTemplate || !layout) {
    return null
  }

  const handleDownload = () => {
    router.push('/resume/export')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {/* Inject Resume Styles */}
      <style dangerouslySetInnerHTML={{ __html: RESUME_STYLES }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
// ... rest of the file ...
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
             Magna-HTML-Renderer Active
          </div>
          
          {meta && meta.droppedEntries > 0 ? (
             <div className="px-3 py-1.5 rounded-full bg-yellow-900/30 border border-yellow-700/50 text-sm text-yellow-300 flex gap-2 items-center">
                 <AlertCircle className="w-4 h-4" />
                 {meta.droppedEntries} items hidden to fit page
             </div>
          ) : null}

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
              FAANG Path
            </div>
            <div className="text-xs text-neutral-500">Professional & ATS-Optimized</div>
          </div>

          {/* Resume Preview Area */}
          <div
            className="overflow-auto bg-white rounded-lg p-0 flex justify-center custom-scrollbar"
            style={{
              height: '850px', // Fixed height container for scrollable preview
              border: '1px solid #333',
            }}
          >
            <div className="w-full h-full origin-top scale-[0.85] lg:scale-100 transition-transform">
               <ResumeHTML layout={layout} />
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400">
            <p>
              ✓ What You See Is What You Get. This preview uses the exact same rendering engine as the PDF export.
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
