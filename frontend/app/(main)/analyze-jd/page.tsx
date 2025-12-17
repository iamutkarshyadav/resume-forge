"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Check,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

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
  const [step, setStep] = useState<"select" | "paste" | "results">("select");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [showGeneratedResume, setShowGeneratedResume] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mounted, setMounted] = useState(false);

  const resumeQuery = trpc.resume.list.useQuery();
  const analyzeMutation = trpc.match.analyzeResumeToJD.useMutation();
  const generateMutation = trpc.match.generateResumeForJD.useMutation();

  const resumes = resumeQuery.data || [];

  // Pre-populate from URL params if available (only on client)
  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const resumeIdParam = params.get("resumeId");
      const jdTextParam = params.get("jdText");

      if (resumeIdParam) setSelectedResumeId(resumeIdParam);
      if (jdTextParam) setJdText(decodeURIComponent(jdTextParam));

      if (resumeIdParam && jdTextParam) {
        setStep("paste");
      }
    } catch (error) {
      console.error("Error reading URL params:", error);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedResumeId || !jdText.trim()) {
      alert("Please select a resume and paste a job description");
      return;
    }

    setLoading(true);
    try {
      const response = await analyzeMutation.mutateAsync({
        resumeId: selectedResumeId,
        jdText: jdText.trim(),
      });

      setResult(response);
      setStep("results");
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!selectedResumeId || !jdText.trim()) return;

    setGeneratingResume(true);
    try {
      const response = await generateMutation.mutateAsync({
        resumeId: selectedResumeId,
        jdText: jdText.trim(),
      });

      setResult((prev) => ({
        ...prev,
        generated: response.generated,
        match: { ...prev?.match, generatedResume: response.match?.generatedResume },
      }));
      setShowGeneratedResume(true);
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate resume. Please try again.");
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
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-semibold">Analyze for Job</h1>
        </motion.header>

        {/* STEP 1: SELECT RESUME */}
        {step === "select" && (
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
                      onClick={() => setStep("paste")}
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

        {/* STEP 2: PASTE JOB DESCRIPTION */}
        {step === "paste" && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle>Step 2: Paste Job Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste the full job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 rounded-lg min-h-48"
                />

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("select")}
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 rounded-lg"
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
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* STEP 3: RESULTS */}
        {step === "results" && result && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="space-y-6"
          >
            {/* SCORE CARD */}
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl font-bold text-white mb-3">
                  {result.match?.score ?? 0}%
                </div>
                <p className="text-lg text-neutral-400 mb-2">Match Score</p>
                <p className="text-sm text-neutral-500">
                  {(result.match?.score ?? 0) > 75
                    ? "Strong match! This resume aligns well with the job."
                    : (result.match?.score ?? 0) > 50
                    ? "Moderate match. Some improvements could help."
                    : "Weak match. Consider significant updates."}
                </p>
              </CardContent>
            </Card>

            {/* SUMMARY */}
            {result.match?.summary && (
              <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-300">
                    {result.match.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* STRENGTHS */}
            {result.match?.strengths && result.match.strengths.length > 0 && (
              <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.match.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* WEAKNESSES */}
            {result.match?.weaknesses && result.match.weaknesses.length > 0 && (
              <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.match.weaknesses.map((weakness, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-neutral-300 flex items-start gap-2"
                      >
                        <span className="text-yellow-400 mt-1">!</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* MISSING SKILLS */}
            {result.match?.missingSkills &&
              result.match.missingSkills.length > 0 && (
                <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Missing Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.match.missingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-3 py-1 rounded-full bg-red-900/30 text-red-300 border border-red-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* RECOMMENDATIONS */}
            {result.match?.recommendations &&
              result.match.recommendations.length > 0 && (
                <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {result.match.recommendations.map(
                        (recommendation, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-neutral-300 flex items-start gap-3"
                          >
                            <span className="font-medium text-neutral-500 min-w-6">
                              {idx + 1}.
                            </span>
                            {recommendation}
                          </li>
                        )
                      )}
                    </ol>
                  </CardContent>
                </Card>
              )}

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleGenerateResume}
                disabled={generatingResume}
                className="flex-1 bg-white text-black hover:bg-neutral-200 rounded-lg"
              >
                {generatingResume ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Improved Resume
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="border-neutral-700"
                onClick={() => setStep("paste")}
              >
                Analyze Another
              </Button>
            </div>
          </motion.section>
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
                    // TODO: Download improved resume
                    alert("Download feature coming soon");
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
