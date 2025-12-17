"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, ChevronRight, Zap } from "lucide-react";

export interface OnboardingStatus {
  id: string;
  userId: string;
  uploadedResume: boolean;
  completedFirstAnalysis: boolean;
  savedJobDescription: boolean;
  viewedProgress: boolean;
  skipped: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isNew: boolean;
  isOnboarding: boolean;
  completedSteps: number;
  totalSteps: number;
  completionPercentage: number;
}

interface OnboardingChecklistProps {
  status: OnboardingStatus;
}

export function OnboardingChecklist({ status }: OnboardingChecklistProps) {
  const router = useRouter();
  const skipMutation = trpc.onboarding.skip.useMutation();

  const steps = [
    {
      id: "resume",
      title: "Upload your first resume",
      description: "Let Resume Forge analyze your background",
      completed: status.uploadedResume,
      icon: "📄",
      action: () => router.push("/resumes"),
      actionLabel: "Upload Resume",
    },
    {
      id: "analysis",
      title: "Run your first analysis",
      description: "Match your resume against a job description",
      completed: status.completedFirstAnalysis,
      icon: "⚡",
      action: () => router.push("/analyze"),
      actionLabel: "Analyze Now",
    },
    {
      id: "jobDescription",
      title: "Save a job description",
      description: "Build your job library for quick comparisons",
      completed: status.savedJobDescription,
      icon: "💼",
      action: () => router.push("/job-descriptions"),
      actionLabel: "Create Job",
    },
    {
      id: "progress",
      title: "Check your progress",
      description: "See how your resume scores improve over time",
      completed: status.viewedProgress,
      icon: "📈",
      action: () => router.push("/progress"),
      actionLabel: "View Progress",
    },
  ];

  const handleSkip = async () => {
    await skipMutation.mutateAsync();
  };

  if (!status.isOnboarding) {
    return null;
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <CardTitle className="text-lg">Let's get you started</CardTitle>
              </div>
              <p className="text-sm text-neutral-400">
                Complete these steps to unlock the full power of Resume Forge
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Progress</span>
              <span className="font-medium text-neutral-300">
                {status.completedSteps} of {status.totalSteps}
              </span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${status.completionPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 pt-2">
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors">
                  <div className="mt-0.5 flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-600 group-hover:text-neutral-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        step.completed
                          ? "text-neutral-400 line-through"
                          : "text-neutral-100"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {!step.completed && (
                    <Button
                      size="sm"
                      onClick={step.action}
                      className="flex-shrink-0 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs"
                    >
                      {step.actionLabel}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={skipMutation.isPending}
              className="text-xs text-neutral-500 hover:text-neutral-400"
            >
              Skip for now
            </Button>
            <div className="text-xs text-neutral-500">
              You can access this anytime in settings
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
