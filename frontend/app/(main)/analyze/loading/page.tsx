"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useErrorHandler } from "@/providers/error-provider";
import { toast } from "sonner";

const loadingSteps = [
  {
    message: "Parsing resume structure…",
    subtext: "Extracting sections, dates, and key information",
  },
  {
    message: "Scanning keywords…",
    subtext: "Identifying skills, technologies, and experience markers",
  },
  {
    message: "Checking ATS compatibility…",
    subtext: "Evaluating format, structure, and parsing readiness",
  },
  {
    message: "Scoring against job description…",
    subtext: "Comparing your resume to role requirements",
  },
];

const engagingMessages = [
  "Did you know? 75% of resumes are never read by a human.",
  "Recruiters spend an average of only 6 seconds on a resume.",
  "ATS systems reject 70% of resumes before they reach a manager.",
  "A single typo can reduce your interview chances by 60%.",
  "Generic resumes get generic rejections. Customization is key.",
  "88% of rejection emails are automated. Let's beat the auto-reject.",
  "Most resumes fail because they lack the right keywords.",
  "Your competition is using AI. Now, so are you.",
];

export default function AnalysisLoadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showErrorFromException } = useErrorHandler();
  const ctx = (trpc as any).useUtils();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const analyzeMutation = (trpc as any).match.analyzeResumeToJD.useMutation({
    retry: (failureCount: number, error: any) => {
      if (error.data?.httpStatus === 503 && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex: number) => Math.min(attemptIndex * 2000, 30000),
  });

  // Perform analysis on mount
  useEffect(() => {
    const resumeId = searchParams.get("resumeId");
    const jdId = searchParams.get("jdId");

    if (!resumeId || !jdId) {
      toast.error("Resume ID or Job Description ID is missing. Redirecting...");
      router.push("/analyze");
      return;
    }

    // Start analysis
    analyzeMutation.mutate(
      {
        resumeId,
        jdId,
      },
      {
        onSuccess: async (data: any) => {
          if (!data?.jobId) {
             toast.error("Analysis failed to start.");
             router.push("/analyze");
             return;
          }

          const jobId = data.jobId;
          
          // Start Polling
          let completed = false;
          let attempts = 0;
          const maxAttempts = 90; // 3 minutes total (2s * 90)

          const poll = async () => {
            if (attempts >= maxAttempts) {
              toast.error("Analysis timed out. Please try again.");
              router.push("/analyze");
              return;
            }

            try {
              // We need the trpc utils context to call queries manually
              // Since we are in a hook, we can't easily use useContext here if it's not already top-level
              // But we can use the `trpc.job.getJobStatus.fetch` if we have the utils
              
              // Wait 2 seconds
              await new Promise(resolve => setTimeout(resolve, 2000));
              attempts++;

              const job = await ctx.job.getJobStatus.fetch({ jobId });

              if (job.status === "completed") {
                const matchId = (job.result as any)?.id;
                if (!matchId) {
                  throw new Error("Match ID missing in job result");
                }
                router.push(`/analyze/results?matchId=${matchId}&jdId=${jdId}`);
                completed = true;
              } else if (job.status === "failed") {
                throw new Error(job.error || "Analysis failed");
              } else {
                // Continue polling
                poll();
              }
            } catch (err: any) {
              toast.error(err.message || "Polling failed");
              router.push("/analyze");
            }
          };

          poll();
        },
        onError: (error: any) => {
          // Safely handle error - check if error exists
          if (!error) {
            toast.error("Analysis failed. Please try again.");
            router.push("/analyze");
            return;
          }
          
          // Extract error message safely
          const errorMessage = error?.message || error?.data?.message || "Something went wrong during the analysis. Please try again.";
          const errorCode = error?.data?.code || error?.code || "INTERNAL_SERVER_ERROR";
          
          // Check if it's a rate limit or plan limit error (shouldn't happen now but handle gracefully)
          if (errorCode === "FORBIDDEN" && (errorMessage.includes("limit") || errorMessage.includes("credits"))) {
            // This shouldn't happen anymore since we removed limits, but handle it gracefully
            toast.error("Analysis failed. Please try again.");
            router.push("/analyze");
            return;
          }
          
          // Using error handler with retry
          showErrorFromException(error, errorMessage);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Rotate through steps (accelerated for UX)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on last step until navigation
      });
    }, 8000); // 8 seconds per step (faster progression)

    // Rotate through engaging messages
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % engagingMessages.length);
    }, 6000); // 6 seconds per message

    return () => {
      clearInterval(stepInterval);
      clearInterval(messageInterval);
    };
  }, []);

  const currentStepData = loadingSteps[currentStep];

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-12">
          <div className="space-y-8 text-center">
            {/* Animated Loader */}
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-16 h-16 border-2 border-foreground border-t-transparent rounded-full"
              />
            </div>

            {/* Step Indicator */}
            <div className="space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-2">
                    {currentStepData.message}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.subtext}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Engaging Message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-sm text-muted-foreground italic"
              >
                {engagingMessages[currentMessage]}
              </motion.p>
            </AnimatePresence>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 pt-8">
              {loadingSteps.map((_, idx) => (
                <motion.div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx <= currentStep
                      ? "bg-foreground w-8"
                      : "bg-muted w-2"
                  }`}
                  initial={false}
                  animate={{
                    width: idx <= currentStep ? 32 : 8,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* Info Text */}
            <p className="text-xs text-muted-foreground pt-4">
              This usually takes 30-60 seconds. Please don't close this page.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
