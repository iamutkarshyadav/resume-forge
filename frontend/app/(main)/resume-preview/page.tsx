"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ResumeTemplate, type ResumeData } from "@/components/ResumeTemplate";
import { toast } from "sonner";
import { useErrorHandler } from "@/providers/error-provider";
import { trpc } from "@/lib/trpc";
import { exportResumeToPdf } from "@/lib/pdf-export";


// Normalize field names for generated resumes
const normalizeResumeData = (data: any): ResumeData => {
  return {
    ...data,
    experience: (data.experience || []).map((exp: any) => ({
      ...exp,
      startDate: exp.startDate || exp.start,
      endDate: exp.endDate || exp.end,
    })),
    education: (data.education || []).map((edu: any) => ({
      ...edu,
      startYear: edu.startYear || edu.start,
      endYear: edu.endYear || edu.end,
    })),
  };
};

// Validate resume data
const validateResumeData = (data: ResumeData): { valid: boolean; missing?: string[] } => {
  const missing = [];
  if (!data.name) missing.push("name");
  if (!data.email) missing.push("email");
  if (!data.phone) missing.push("phone");
  if (!data.summary) missing.push("summary");

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
};

type LoadingState = "idle" | "generating" | "success" | "error";

export default function ResumePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeRef = useRef<HTMLDivElement>(null);
  const { showErrorFromException } = useErrorHandler();
  const generationTriggeredRef = useRef(false);

  // State management
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // tRPC mutation - stable reference
  const generateResumeMutation = trpc.match.generateResumeForJD.useMutation();

  // Memoized generation function
  const triggerGeneration = useCallback(async (resumeId: string, jdText: string) => {
    // Prevent multiple triggers
    if (generationTriggeredRef.current) return;
    generationTriggeredRef.current = true;

    setLoadingState("generating");
    setError(null);

    // Set a timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      if (generationTriggeredRef.current) {
        console.warn("Generation timeout - operation took too long");
        setLoadingState("error");
        setError("Resume generation took too long. Please try again.");
        toast.error("Resume generation timeout. Please try again.");
      }
    }, 120000); // 2 minute timeout

    try {
      const response = await Promise.race([
        generateResumeMutation.mutateAsync({
          resumeId,
          jdText: decodeURIComponent(jdText),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Generation request timeout")), 90000)
        ),
      ]);

      clearTimeout(timeoutId);

      // Extract generated data
      const generatedData = (response as any)?.generated || (response as any)?.match?.generatedResume;

      if (!generatedData) {
        throw new Error("No resume data returned from generation");
      }

      // Normalize and validate
      const normalizedData = normalizeResumeData(generatedData);
      const validation = validateResumeData(normalizedData);

      if (!validation.valid) {
        throw new Error(
          `Resume data is incomplete. Missing: ${validation.missing?.join(", ")}`
        );
      }

      // Success - update state and show notification
      setResumeData(normalizedData);
      setLoadingState("success");
      toast.success("Resume generated successfully!");
    } catch (err) {
      console.error("Generation error:", err);
      clearTimeout(timeoutId);

      const errorMessage = err instanceof Error ? err.message : "Failed to generate resume";
      setError(errorMessage);
      setLoadingState("error");

      // Ensure we dismiss any loading toasts and show error
      toast.dismiss();
      toast.error(errorMessage);
      showErrorFromException(err, "Resume Generation Failed");
    }
  }, [generateResumeMutation, showErrorFromException]);

  // Initialize: validate params and trigger generation once
  useEffect(() => {
    setMounted(true);

    const resumeId = searchParams.get("resumeId");
    const jdText = searchParams.get("jdText");

    // Validate inputs
    if (!resumeId || !jdText) {
      setError("Missing resume ID or job description. Please go back and try again.");
      setLoadingState("error");
      return;
    }

    // Trigger generation (only once, guarded by ref)
    triggerGeneration(resumeId, jdText);
  }, []); // Empty dependency array - run once on mount

  // Handle PDF export
  const handleDownloadPDF = useCallback(async () => {
    if (!resumeRef.current) {
      toast.error("Resume template not found");
      return;
    }

    if (!resumeData) {
      toast.error("Resume data not available");
      return;
    }

    setExporting(true);
    try {
      const fileName = `Resume_${resumeData.name.replace(/\s+/g, "_")}.pdf`;
      toast.loading("Generating PDF...", { id: "pdf-export" });

      // Use the new simplified PDF export
      await exportResumeToPdf(resumeRef.current, fileName);

      // Dismiss loading toast and show success
      toast.dismiss("pdf-export");
      toast.success(`${fileName} downloaded successfully`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.dismiss("pdf-export");
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [resumeData]);

  // Render while mounting
  if (!mounted) {
    return null;
  }

  // Render: Loading state
  if (loadingState === "generating") {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col items-center justify-center h-96 space-y-8">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="flex justify-center"
              >
                <Loader2 className="h-12 w-12 text-white" />
              </motion.div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">Generating Your Optimized Resume</p>
                <p className="text-sm text-neutral-400">
                  Our AI is analyzing the job description and tailoring your resume...
                </p>
              </div>
            </div>

            <Card className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <CardContent className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-300">Preview Template</h3>
                <p className="text-xs text-neutral-500">
                  Your resume will be displayed in this FAANG Path template once generation is complete.
                </p>
                <div className="h-48 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-center">
                  <div className="text-center text-neutral-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading template preview...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  // Render: Error state
  if (loadingState === "error" || error) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </motion.button>

          <Card className="bg-red-900/10 border border-red-700/30">
            <CardContent className="p-8">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold text-red-300 mb-2">
                    Unable to Generate Resume
                  </h2>
                  <p className="text-neutral-300 mb-6">
                    {error || "An error occurred while generating your resume. Please try again."}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        generationTriggeredRef.current = false;
                        router.back();
                      }}
                      variant="outline"
                      className="border-neutral-700 text-neutral-300"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={() => router.push("/analyze")}
                      className="bg-white text-black hover:bg-neutral-200"
                    >
                      Back to Analysis
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Render: Success state - Resume Preview
  if (loadingState === "success" && resumeData) {
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
            <h1 className="text-4xl font-semibold tracking-tight">Your Optimized Resume</h1>
            <p className="text-neutral-500 mt-2">
              Your resume has been optimized for this job. Download it now or select a different template.
            </p>
          </motion.div>

          {/* Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-4 mb-8"
          >
            <Button
              disabled
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              FAANG Path Template Selected
            </Button>

            <Button
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="bg-white text-black hover:bg-neutral-200 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 rounded-lg bg-green-900/10 border border-green-700/30 text-sm text-green-300 flex gap-3"
          >
            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Resume Ready for Download</p>
              <p className="text-neutral-400 mt-1">
                Your resume has been automatically optimized and mapped to the template. Click "Download PDF" to save it.
              </p>
            </div>
          </motion.div>

          {/* Template Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 mb-8"
          >
            {/* Template Name Badge */}
            <div className="mb-6 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-sm text-blue-300">
                FAANG Path Template
              </div>
              <div className="text-xs text-neutral-500">Professional & ATS-Optimized</div>
            </div>

            {/* Resume Preview Area - Scrollable */}
            <div
              className="overflow-auto bg-white rounded-lg p-0"
              style={{
                maxHeight: "800px",
                border: "1px solid #e5e7eb",
              }}
            >
              <ResumeTemplate ref={resumeRef} data={resumeData} templateName="faang-path" />
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400">
              <p>
                ✓ This template is optimized for Applicant Tracking Systems (ATS) with clean formatting
                and standard fonts. All your data has been automatically populated from your generated resume.
              </p>
            </div>
          </motion.div>

          {/* Template Selection Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 pt-8 border-t border-neutral-800"
          >
            <h2 className="text-xl font-semibold mb-6">Available Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Template Card - Selected */}
              <Card className="border-2 border-green-600 bg-green-900/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">FAANG Path</h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    Clean, modern template optimized for ATS systems. Best for tech roles.
                  </p>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400">Selected & Ready</span>
                  </div>
                </CardContent>
              </Card>

              {/* Future Template Placeholder */}
              <Card className="border-neutral-700 border-dashed opacity-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-neutral-400">More Templates</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Additional templates coming soon. Mix and match designs to find your perfect match.
                  </p>
                  <span className="text-xs text-neutral-600">Coming Soon</span>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Fallback render (should not reach here)
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="bg-neutral-950 border border-neutral-800">
          <CardContent className="p-8 text-center">
            <p className="text-neutral-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
