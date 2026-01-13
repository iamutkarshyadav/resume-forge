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
  Sparkles,
  FileText
} from "lucide-react";
import { ResumeTemplate, type ResumeData } from "@/components/ResumeTemplate";
import { toast } from "sonner";
import { useErrorHandler } from "@/providers/error-provider";
import { trpc } from "@/lib/trpc";
import { trpc } from "@/lib/trpc";

// Normalize field names for generated resumes with defensive checks
const normalizeResumeData = (data: any): ResumeData => {
  if (!data) return {} as ResumeData;
  
  return {
    ...data,
    name: data.name || "Candidate Name",
    email: data.email || "",
    experience: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
      ...exp,
      startDate: exp.startDate || exp.start || "",
      endDate: exp.endDate || exp.end || "",
    })) : [],
    education: Array.isArray(data.education) ? data.education.map((edu: any) => ({
      ...edu,
      startYear: edu.startYear || edu.start || "",
      endYear: edu.endYear || edu.end || "",
    })) : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
  };
};

type LoadingState = "idle" | "generating" | "success" | "error";

export default function ResumePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeRef = useRef<HTMLDivElement>(null); // Keep ref for template rendering
  const { showErrorFromException } = useErrorHandler();

  // State management
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Inputs
  const resumeId = searchParams.get("resumeId");
  const jdId = searchParams.get("jdId");
  const jdText = searchParams.get("jdText"); // Legacy support - prefer jdId

  // tRPC queries and mutations
  const jdQuery = trpc.jobDescription.get.useQuery(
    { jdId: jdId! },
    { enabled: !!jdId && !jdText, retry: 1 }
  );
  const generateResumeMutation = trpc.match.generateResumeForJD.useMutation();
  const eligibilityQuery = trpc.pdf.checkDownloadEligibility.useQuery();
  const generatePdfMutation = trpc.pdf.generateAndDownloadPDF.useMutation();

  useEffect(() => {
    setMounted(true);
    if (!resumeId) {
      setError("Missing resume ID.");
      setLoadingState("error");
      return;
    }
    if (!jdId && !jdText) {
      setError("Missing job description ID or text.");
      setLoadingState("error");
      return;
    }
    // DO NOT auto-trigger generation - user must click button
    // This ensures manual trigger workflow
  }, [resumeId, jdId, jdText]);

  const handleGenerate = async () => {
    if (!resumeId) {
      toast.error("Missing resume ID");
      return;
    }

    // Get jdId - prefer from query param, otherwise try to get from JD query
    const finalJdId = jdId || (jdQuery.data?.id);
    
    if (!finalJdId) {
      // Legacy support: if jdText is provided, we can't use it with the backend
      // Redirect user to analyze flow instead
      toast.error("Job description ID is required. Please start from the analyze page.");
      router.push("/analyze");
      return;
    }

    setLoadingState("generating");
    setError(null);
    
    try {
      // 2 minute timeout for AI generation
      const response = await Promise.race([
        generateResumeMutation.mutateAsync({
          resumeId,
          jdId: finalJdId,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Generation request timeout")), 180000)
        ),
      ]);

      const generatedData = (response as any)?.generated || (response as any)?.match?.generatedResume;

      if (!generatedData) {
        throw new Error("No resume data returned from generation");
      }

      const normalizedData = normalizeResumeData(generatedData);
      setResumeData(normalizedData);
      setLoadingState("success");
      toast.success("Resume generated successfully!");
    } catch (err: any) {
      console.error("Generation error:", err);
      const errorMessage = err.message || "Failed to generate resume";
      setError(errorMessage);
      setLoadingState("error");
      showErrorFromException(err, "Resume Generation Failed");
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeData) {
      toast.error("Resume data not ready");
      return;
    }

    // Check if user has credits before attempting download
    if (!eligibilityQuery.data || !eligibilityQuery.data.canDownload) {
      toast.error("Insufficient credits. Please purchase credits to download PDFs.");
      router.push("/billing");
      return;
    }

    setExporting(true);
    try {
      const fileName = `Resume_${(resumeData.name || "Optimized").replace(/\s+/g, "_")}.pdf`;
      toast.loading("Generating PDF...", { id: "pdf-export" });
      
      // Use server-side PDF generation with credit check
      const result = await generatePdfMutation.mutateAsync({
        resumeData: resumeData,
        fileName: fileName,
      });

      if (result.success && result.pdfBase64) {
        // Decode base64 to blob and download
        const binaryString = window.atob(result.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.dismiss("pdf-export");
        toast.success(`${fileName} downloaded successfully! ${result.creditsRemaining} credits remaining.`);
        
        // Refresh eligibility to update UI
        await eligibilityQuery.refetch();
      } else {
        throw new Error("PDF generation failed - no data returned");
      }
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.dismiss("pdf-export");
      
      // Safely extract error message
      const errorCode = err?.data?.code || err?.code;
      const errorMessage = err?.message || err?.data?.message || "Failed to export PDF";
      
      if (errorCode === "PRECONDITION_FAILED" || errorMessage.toLowerCase().includes("credit")) {
        toast.error("Insufficient credits. Please purchase more credits to download PDFs.");
        router.push("/billing");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setExporting(false);
    }
  };

  if (!mounted) return null;

  // 1. Initial State: Ready to Generate
  if (loadingState === "idle") {
    return (
      <main className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
        <div className="max-w-xl w-full text-center space-y-8">
           <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="absolute top-8 left-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="space-y-4">
            <div className="mx-auto h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Ready to Optimize</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Our AI is ready to rewrite your resume specifically for this job description.
              This process usually takes about 30-60 seconds.
            </p>
          </div>

          <Card className="text-left">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Source Resume</p>
                  <p className="text-xs text-muted-foreground">ID: {resumeId?.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Job Description</p>
                  <p className="text-xs text-muted-foreground">
                    {jdQuery.isLoading ? "Loading..." : 
                     jdQuery.data?.title || jdId ? `ID: ${jdId?.slice(0, 8)}...` : 
                     jdText ? `${decodeURIComponent(jdText).slice(0, 50)}...` : 
                     'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleGenerate} 
            size="lg" 
            className="w-full font-semibold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Optimized Resume
          </Button>
        </div>
      </main>
    );
  }

  // 2. Loading State
  if (loadingState === "generating") {
    return (
      <main className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center">
         <div className="text-center space-y-6 max-w-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="flex justify-center"
            >
              <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Generating Your Resume...</h2>
              <p className="text-muted-foreground">
                Analyzing keywords, rewriting bullet points, and formatting for ATS success.
              </p>
            </div>

            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-blue-600 dark:bg-blue-400"
                 initial={{ width: "0%" }}
                 animate={{ width: "90%" }}
                 transition={{ duration: 30, ease: "easeOut" }}
               />
            </div>
            <p className="text-xs text-muted-foreground">Please do not close this tab.</p>
         </div>
      </main>
    );
  }

  // 3. Error State
  if (loadingState === "error") {
    return (
      <main className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Generation Failed</h2>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => router.back()} 
                  variant="outline" 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate} 
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
        </Card>
      </main>
    );
  }

  // 4. Success State (Preview)
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <h1 className="text-2xl font-semibold">Optimized Resume</h1>
           </div>
           <div className="flex gap-3">
              <Button disabled variant="outline" className="border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400">
                 <Check className="h-4 w-4 mr-2" /> Template Applied
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                disabled={exporting}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Download className="h-4 w-4 mr-2"/>}
                Download PDF
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-card rounded-lg overflow-hidden shadow-xl border">
                 <div className="overflow-auto max-h-[800px]">
                    <ResumeTemplate ref={resumeRef} data={resumeData!} templateName="faang-path" />
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <Card>
                 <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold">Why this template?</h3>
                    <p className="text-sm text-muted-foreground">
                       This "FAANG Path" template is designed for high ATS readability. 
                       It uses standard fonts, clear headers, and bullet points that parsers love.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                       <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-200 dark:border-blue-800">ATS Optimized</span>
                       <span className="px-2 py-1 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs rounded border border-purple-200 dark:border-purple-800">Clean Layout</span>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </main>
  );
}