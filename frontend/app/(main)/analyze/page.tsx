"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Download,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AnalysisResults } from "@/components/AnalysisResults";
import { toast } from "sonner";

type AnalysisResult = {
  match?: {
    score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    missingSkills?: string[];
    recommendations?: string[];
    generatedResume?: any;
  };
  generated?: any;
};

export default function AnalyzeForJobPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select-resume" | "choose-jd" | "results">("select-resume");
  const [jdMode, setJdMode] = useState<"paste" | "saved">("paste");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedJdId, setSelectedJdId] = useState<string>("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [showGeneratedResume, setShowGeneratedResume] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mounted, setMounted] = useState(false);

  const resumeQuery = trpc.resume.list.useQuery();
  const jdQuery = trpc.jobDescription.list.useQuery({ tag: null });
  const analyzeMutation = trpc.match.analyzeResumeToJD.useMutation();
  const generateMutation = trpc.match.generateResumeForJD.useMutation();

  const resumes = resumeQuery.data || [];
  const savedJds = jdQuery.data || [];

  // Pre-populate from URL params if available (only on client)
  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const resumeIdParam = params.get("resumeId");
      const jdTextParam = params.get("jdText");
      const jdIdParam = params.get("jdId");

      if (resumeIdParam) setSelectedResumeId(resumeIdParam);
      if (jdTextParam) {
        setJdText(decodeURIComponent(jdTextParam));
        setJdMode("paste");
      }
      if (jdIdParam) {
        setSelectedJdId(jdIdParam);
        setJdMode("saved");
      }

      if (resumeIdParam && (jdTextParam || jdIdParam)) {
        setStep("choose-jd");
      }
    } catch (error) {
      console.error("Error reading URL params:", error);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedResumeId) {
      toast.error("Please select a resume");
      return;
    }

    const textToAnalyze = jdMode === "paste" ? jdText : savedJds.find(j => j.id === selectedJdId)?.fullText;

    if (!textToAnalyze || !textToAnalyze.trim()) {
      toast.error("Please provide a job description");
      return;
    }

    setLoading(true);
    try {
      const response = await analyzeMutation.mutateAsync({
        resumeId: selectedResumeId,
        jdText: textToAnalyze.trim(),
        jdId: jdMode === "saved" ? selectedJdId : undefined,
      });

      setResult(response);
      setStep("results");
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!selectedResumeId) return;

    const textToAnalyze = jdMode === "paste" ? jdText : savedJds.find(j => j.id === selectedJdId)?.fullText;
    if (!textToAnalyze) return;

    setGeneratingResume(true);
    try {
      const response = await generateMutation.mutateAsync({
        resumeId: selectedResumeId,
        jdText: textToAnalyze.trim(),
      });

      setResult((prev) => ({
        ...prev,
        generated: response.generated,
        match: { ...prev?.match, generatedResume: response.match?.generatedResume },
      }));
      setShowGeneratedResume(true);
      toast.success("Resume generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate resume. Please try again.");
    } finally {
      setGeneratingResume(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (step === "select-resume") {
                router.back();
              } else {
                setStep("select-resume");
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-semibold">Analyze Resume</h1>
        </motion.header>

        {/* STEP 1: SELECT RESUME */}
        {step === "select-resume" && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle>Step 1: Select a Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumes.length === 0 ? (
                  <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-center text-neutral-400">
                    <p className="text-sm">No resumes found.</p>
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/resumes")}
                      className="mt-2"
                    >
                      Upload one first
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedResumeId}
                      onValueChange={setSelectedResumeId}
                    >
                      <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white rounded-lg">
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

                    <Button
                      onClick={() => setStep("choose-jd")}
                      disabled={!selectedResumeId}
                      className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* STEP 2: CHOOSE JOB DESCRIPTION */}
        {step === "choose-jd" && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle>Step 2: Choose a Job Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex gap-3">
                  <Button
                    variant={jdMode === "paste" ? "default" : "outline"}
                    onClick={() => {
                      setJdMode("paste");
                      setSelectedJdId("");
                    }}
                    className="flex-1 rounded-lg"
                  >
                    Paste New
                  </Button>
                  <Button
                    variant={jdMode === "saved" ? "default" : "outline"}
                    onClick={() => {
                      setJdMode("saved");
                      setJdText("");
                    }}
                    className="flex-1 rounded-lg"
                  >
                    Use Saved
                  </Button>
                </div>

                {/* Paste Mode */}
                {jdMode === "paste" && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste the full job description here..."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 rounded-lg min-h-48"
                    />
                  </div>
                )}

                {/* Saved Mode */}
                {jdMode === "saved" && (
                  <div className="space-y-4">
                    {savedJds.length === 0 ? (
                      <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-center text-neutral-400">
                        <p className="text-sm mb-3">No saved job descriptions yet.</p>
                        <Button
                          variant="ghost"
                          onClick={() => router.push("/job-descriptions")}
                          className="text-neutral-300"
                        >
                          Create one in Job Library
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={selectedJdId}
                        onValueChange={setSelectedJdId}
                      >
                        <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white rounded-lg">
                          <SelectValue placeholder="Choose a saved job description..." />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-800">
                          {savedJds.map((jd: any) => (
                            <SelectItem key={jd.id} value={jd.id}>
                              {jd.title} {jd.company && `@ ${jd.company}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setStep("select-resume")}
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 rounded-lg"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={
                      loading ||
                      !selectedResumeId ||
                      (jdMode === "paste" && !jdText.trim()) ||
                      (jdMode === "saved" && !selectedJdId)
                    }
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
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* STEP 3: RESULTS */}
        {step === "results" && result && (
          <AnalysisResults
            data={result}
            onGenerateResume={handleGenerateResume}
            onAnalyzeAnother={() => setStep("choose-jd")}
            generatingResume={generatingResume}
          />
        )}
      </div>

      {/* GENERATED RESUME MODAL */}
      <Dialog open={showGeneratedResume} onOpenChange={setShowGeneratedResume}>
        <DialogContent className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Improved Resume</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {result?.generated ? (
              <>
                <div className="prose prose-invert max-w-none text-sm">
                  <pre className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 text-xs overflow-x-auto">
                    {JSON.stringify(result.generated, null, 2)}
                  </pre>
                </div>

                <Button
                  onClick={() => {
                    toast.info("Download feature coming soon");
                  }}
                  className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Improved Resume
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-neutral-400">
                <p>Failed to generate resume</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
