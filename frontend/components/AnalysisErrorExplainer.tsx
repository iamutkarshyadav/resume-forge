"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  FileText,
  Lightbulb,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface ErrorExplanation {
  type: "error" | "low_confidence" | "warning";
  title: string;
  message: string;
  reason: string;
  suggestions: string[];
  confidenceScore?: number;
}

interface AnalysisErrorExplainerProps {
  error?: ErrorExplanation;
  onRetry?: () => void;
  retryLoading?: boolean;
}

export function AnalysisErrorExplainer({
  error,
  onRetry,
  retryLoading,
}: AnalysisErrorExplainerProps) {
  if (!error) return null;

  const icons = {
    error: <AlertCircle className="h-8 w-8 text-red-400" />,
    low_confidence: <AlertCircle className="h-8 w-8 text-yellow-400" />,
    warning: <AlertCircle className="h-8 w-8 text-blue-400" />,
  };

  const bgColors = {
    error: "bg-red-900/20 border-red-700/30",
    low_confidence: "bg-yellow-900/20 border-yellow-700/30",
    warning: "bg-blue-900/20 border-blue-700/30",
  };

  const textColors = {
    error: "text-red-300",
    low_confidence: "text-yellow-300",
    warning: "text-blue-300",
  };

  const reasonPoints = {
    resume_too_short:
      "Your resume contains fewer than 200 words. Analysis accuracy improves with more detailed information about your experience, skills, and achievements.",
    jd_too_short:
      "The job description provided is very brief. More detailed job descriptions help identify better matches.",
    missing_keywords:
      "Limited job-specific keywords detected. This may indicate a mismatch between your resume and the position.",
    low_formatting_quality:
      "The resume text extraction shows unusual formatting. This might affect analysis accuracy.",
    no_experience_listed:
      "No clear professional experience section detected. Consider adding a structured experience section.",
    generic_resume:
      "Your resume appears generic. Consider tailoring it with specific keywords from the job description.",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className={`border ${bgColors[error.type]}`}>
        <CardContent className="p-6">
          <div className="flex gap-4">
            {icons[error.type]}
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{error.title}</h3>
              <p className={`text-sm ${textColors[error.type]} mb-3`}>
                {error.message}
              </p>

              {error.confidenceScore !== undefined && (
                <div className="mb-3">
                  <p className="text-xs text-neutral-400 mb-2">
                    Confidence Score: {error.confidenceScore}%
                  </p>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        error.confidenceScore >= 80
                          ? "bg-green-500"
                          : error.confidenceScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${error.confidenceScore}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 bg-black/30 rounded-lg">
                <p className="text-xs text-neutral-300 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Why this happened:</strong>{" "}
                    {reasonPoints[error.reason as keyof typeof reasonPoints] ||
                      error.reason}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-400" />
          What You Can Do:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {error.suggestions.map((suggestion, idx) => (
            <Card
              key={idx}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              <CardContent className="p-3">
                <p className="text-sm text-neutral-300 flex items-start gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700 flex-shrink-0 text-xs font-bold">
                    {idx + 1}
                  </span>
                  {suggestion}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={retryLoading}
          className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${retryLoading ? "animate-spin" : ""}`} />
          {retryLoading ? "Analyzing..." : "Try Again"}
        </Button>
      )}

      <Card className="bg-neutral-900/50 border border-neutral-800">
        <CardContent className="p-4">
          <p className="text-xs text-neutral-400">
            💡 <strong>Tip:</strong> For best results, ensure your resume has
            detailed descriptions of your experience, uses relevant keywords
            from the job description, and is well-formatted.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
