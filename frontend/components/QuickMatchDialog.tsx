"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useNotifications } from "@/hooks/use-notifications";

interface QuickMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickMatchDialog({ open, onOpenChange }: QuickMatchDialogProps) {
  const router = useRouter();
  const { error: errorNotify, success: successNotify } = useNotifications();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    summary: string;
  } | null>(null);

  const resumeQuery = trpc.resume.list.useQuery({
    enabled: open,
  });
  const analyzeMutation = trpc.match.analyzeResumeToJD.useMutation();

  const resumes = resumeQuery.data || [];

  const handleAnalyze = async () => {
    if (!selectedResumeId || !jdText.trim()) {
      errorNotify("Please select a resume and paste a job description");
      return;
    }

    setLoading(true);
    try {
      const response = await analyzeMutation.mutateAsync({
        resumeId: selectedResumeId,
        jdText: jdText.trim(),
      });

      setResult({
        score: response.match?.score || 0,
        summary:
          response.match?.summary ||
          "Analysis complete. View details for more insights.",
      });
      successNotify("Analysis completed successfully");
      setStep(3);
    } catch (error: any) {
      console.error("Analysis error:", error);
      const message = error?.message || "Failed to analyze. Please try again.";
      errorNotify(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFull = () => {
    onOpenChange(false);
    // Store the data in URL params or state for the analyze page
    router.push(`/analyze?resumeId=${selectedResumeId}&jdText=${encodeURIComponent(jdText)}`);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedResumeId("");
    setJdText("");
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // Cleanup when dialog closes
  React.useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      const timer = setTimeout(() => {
        setStep(1);
        setSelectedResumeId("");
        setJdText("");
        setResult(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {step === 1 && "Select Resume"}
            {step === 2 && "Paste Job Description"}
            {step === 3 && "Match Score"}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {step === 1 && "Pick a resume to match against a job posting"}
            {step === 2 && "Paste the job description you want to match"}
            {step === 3 && "Your match analysis is ready"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* STEP 1: SELECT RESUME */}
          {step === 1 && (
            <div className="space-y-3">
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectValue placeholder="Choose a resume..." />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  {resumes.map((resume: any) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {resumes.length === 0 && (
                <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-center text-sm text-neutral-400">
                  No resumes found. Upload one first.
                </div>
              )}

              <Button
                onClick={() => setStep(2)}
                disabled={!selectedResumeId}
                className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* STEP 2: PASTE JD */}
          {step === 2 && (
            <div className="space-y-3">
              <Textarea
                placeholder="Paste the full job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 rounded-lg min-h-40"
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-neutral-700 text-neutral-300 rounded-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={!jdText.trim() || loading}
                  className="flex-1 bg-white text-black hover:bg-neutral-200 rounded-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS */}
          {step === 3 && result && (
            <div className="space-y-4">
              <Card className="bg-neutral-900 border border-neutral-800">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-white mb-2">
                    {result.score}%
                  </div>
                  <p className="text-sm text-neutral-400">Match Score</p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 border border-neutral-800">
                <CardContent className="p-4">
                  <p className="text-sm text-neutral-300">{result.summary}</p>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-neutral-700 text-neutral-300 rounded-lg"
                >
                  Try Another
                </Button>
                <Button
                  onClick={handleViewFull}
                  className="flex-1 bg-white text-black hover:bg-neutral-200 rounded-lg"
                >
                  View Full Analysis
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
