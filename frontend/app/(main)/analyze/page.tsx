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
  CheckCircle2,
  Circle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AnalysisResults } from "@/components/AnalysisResults";
import { useErrorHandler } from "@/providers/error-provider";
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
  const { showErrorFromException } = useErrorHandler();
  const [step, setStep] = useState<"select-resume" | "choose-jd" | "results">("select-resume");
  const [jdMode, setJdMode] = useState<"paste" | "saved">("paste");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedResumeName, setSelectedResumeName] = useState<string>("");
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

  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const resumeIdParam = params.get("resumeId");
      const jdTextParam = params.get("jdText");
      const jdIdParam = params.get("jdId");

      if (resumeIdParam) {
        setSelectedResumeId(resumeIdParam);
        const resumeName = resumes.find((r: any) => r.id === resumeIdParam)?.filename || "";
        setSelectedResumeName(resumeName);
      }
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
  }, [resumes]);

  const handleResumeSelect = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    const resumeName = resumes.find((r: any) => r.id === resumeId)?.filename || "";
    setSelectedResumeName(resumeName);
  };

  const handleProgressToStep2 = () => {
    if (selectedResumeId) {
      setStep("choose-jd");
    } else {
      toast.error("Please select a resume first");
    }
  };

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
      showErrorFromException(error, "Analysis Failed");
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
      showErrorFromException(error, "Generation Failed");
    } finally {
      setGeneratingResume(false);
    }
  };

  const step1Complete = !!selectedResumeId;
  const step2Complete = step === "results";

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (step === "results" && result) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <AnalysisResults
            data={result}
            onGenerateResume={handleGenerateResume}
            onAnalyzeAnother={() => setStep("choose-jd")}
            generatingResume={generatingResume}
          />
        </div>

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

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
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
          <h1 className="text-4xl font-semibold tracking-tight">Analyze Resume</h1>
          <p className="text-neutral-500 mt-2">
            Compare your resume against job descriptions and get personalized insights
          </p>
        </motion.header>

        {/* TWO-COLUMN LAYOUT: Timeline + Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: TIMELINE INDICATOR */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="hidden lg:block"
          >
            <div className="sticky top-8 space-y-6">
              {/* STEP 1 */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{
                      scale: step1Complete ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    {step1Complete ? (
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-neutral-800 border-2 border-white flex items-center justify-center">
                        <span className="text-sm font-semibold">1</span>
                      </div>
                    )}
                  </motion.div>
                  <div className="flex-1 pt-1">
                    <p className={`text-sm font-semibold transition-colors ${
                      step1Complete ? "text-green-400" : "text-white"
                    }`}>
                      Select Resume
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {step1Complete ? `${selectedResumeName}` : "Pick a resume to analyze"}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="absolute left-5 top-10 w-0.5 h-12 bg-gradient-to-b from-white to-neutral-800" />
              </div>

              {/* STEP 2 */}
              <div className="relative pt-4">
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{
                      scale: step === "choose-jd" || step2Complete ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    {step2Complete ? (
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                        step === "choose-jd" || step1Complete
                          ? "bg-neutral-800 border-white"
                          : "bg-neutral-900 border-neutral-700"
                      }`}>
                        <span className={`text-sm font-semibold transition-colors ${
                          step === "choose-jd" || step1Complete ? "text-white" : "text-neutral-600"
                        }`}>
                          2
                        </span>
                      </div>
                    )}
                  </motion.div>
                  <div className="flex-1 pt-1">
                    <p className={`text-sm font-semibold transition-colors ${
                      step2Complete ? "text-green-400" : step === "choose-jd" || step1Complete ? "text-white" : "text-neutral-600"
                    }`}>
                      Analyze
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {step2Complete ? "Analysis complete" : "Add job description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: STEP CONTENT */}
          <div className="lg:col-span-3 space-y-6">
            {/* STEP 1: SELECT RESUME */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stepVariants}
            >
              <Card className={`rounded-2xl transition-all ${
                step1Complete
                  ? "bg-neutral-950 border border-green-500/20"
                  : "bg-neutral-950 border border-neutral-800"
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800">
                        <span className="text-sm font-semibold">1</span>
                      </div>
                      <CardTitle>Select Your Resume</CardTitle>
                    </div>
                    {step1Complete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 mt-2">
                    This helps us tailor insights specifically to your background
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {resumes.length === 0 ? (
                    <div className="p-6 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
                      <p className="text-sm text-neutral-400 mb-3">No resumes uploaded yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/resumes")}
                        className="border-neutral-700"
                      >
                        Upload a Resume
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Select
                        value={selectedResumeId}
                        onValueChange={handleResumeSelect}
                        disabled={step1Complete && step === "choose-jd"}
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

                      {step1Complete && step !== "choose-jd" && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <p className="text-sm text-green-300">Resume selected</p>
                        </motion.div>
                      )}

                      {step === "choose-jd" ? (
                        <Button
                          onClick={() => setStep("select-resume")}
                          variant="outline"
                          className="w-full border-neutral-700 text-neutral-300 rounded-lg"
                        >
                          Change Resume
                        </Button>
                      ) : (
                        <Button
                          onClick={handleProgressToStep2}
                          disabled={!step1Complete}
                          className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
                        >
                          Continue to Job Description
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* STEP 2: CHOOSE JOB DESCRIPTION */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stepVariants}
              transition={{ delay: 0.1 }}
            >
              <Card className={`rounded-2xl transition-all ${
                step === "choose-jd"
                  ? "bg-neutral-950 border border-neutral-800"
                  : "bg-neutral-900/40 border border-neutral-800/40"
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        step === "choose-jd" || step1Complete
                          ? "bg-neutral-800"
                          : "bg-neutral-800/50"
                      }`}>
                        <span className={`text-sm font-semibold transition-colors ${
                          step === "choose-jd" || step1Complete
                            ? "text-white"
                            : "text-neutral-600"
                        }`}>
                          2
                        </span>
                      </div>
                      <CardTitle className={step === "choose-jd" || step1Complete ? "text-white" : "text-neutral-600"}>
                        Add Job Description
                      </CardTitle>
                    </div>
                  </div>
                  <p className={`text-sm mt-2 ${
                    step === "choose-jd" || step1Complete
                      ? "text-neutral-400"
                      : "text-neutral-600"
                  }`}>
                    {step === "choose-jd" || step1Complete
                      ? "Compare your resume against the role requirements"
                      : "Complete Step 1 to continue"}
                  </p>
                </CardHeader>

                {(step === "choose-jd" || step1Complete) && (
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
                      <div className="space-y-3">
                        <label className="text-sm text-neutral-400">
                          Paste the full job description
                        </label>
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
                          <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
                            <p className="text-sm text-neutral-400 mb-3">No saved job descriptions yet</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push("/job-descriptions")}
                              className="border-neutral-700"
                            >
                              Create in Job Library
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-sm text-neutral-400">
                              Select a saved job description
                            </label>
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
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-neutral-800">
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
                            Analyze Resume
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
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
