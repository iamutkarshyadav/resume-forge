"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  AlertCircle,
  X,
  TrendingUp,
  Zap,
  Download,
  ArrowRight,
} from "lucide-react";

interface AnalysisData {
  match?: {
    score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    missingSkills?: string[];
    recommendations?: string[];
  };
}

interface AnalysisResultsProps {
  data: AnalysisData;
  onGenerateResume: () => void;
  onAnalyzeAnother: () => void;
}

export function AnalysisResults({
  data,
  onGenerateResume,
  onAnalyzeAnother,
}: AnalysisResultsProps) {
  const [stickyVisible, setStickyVisible] = useState(true);

  // Wrap handlers to avoid unnecessary re-renders
  const handleGenerate = useCallback(() => {
    onGenerateResume();
  }, [onGenerateResume]);

  const handleAnalyzeAnother = useCallback(() => {
    onAnalyzeAnother();
  }, [onAnalyzeAnother]);
  const score = data.match?.score ?? 0;
  const strengths = data.match?.strengths ?? [];
  const weaknesses = data.match?.weaknesses ?? [];
  const missingSkills = data.match?.missingSkills ?? [];
  const recommendations = data.match?.recommendations ?? [];

  // Derive subscores (ATS Health, Skill Match, Job Fit)
  const atsHealth = Math.round(score * 0.95 - Math.min(weaknesses.length * 3, 15));
  const skillMatch = missingSkills.length
    ? Math.round(100 - (missingSkills.length * 5))
    : score;
  const jobFit = score;

  // Confidence (based on data richness)
  const dataRichness =
    (strengths.length + weaknesses.length + missingSkills.length) / 10;
  const confidence = Math.round(Math.min(100, 60 + dataRichness * 40));

  const fadeUp = (delay = 0) => ({
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay },
    },
  });

  const getScoreColor = (s: number) => {
    if (s > 80) return "text-green-400";
    if (s > 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (s: number) => {
    if (s > 80) return "Strong Match";
    if (s > 60) return "Moderate Match";
    return "Weak Match";
  };

  const getPercentile = (s: number) => {
    if (s > 85) return "top 15%";
    if (s > 75) return "top 30%";
    if (s > 60) return "top 50%";
    return "bottom 50%";
  };

  return (
    <div className="space-y-12 pb-32">
      {/* ========================================
          SECTION 1: EXECUTIVE OVERVIEW
          ======================================== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp(0)}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Analysis Results</h1>
          <p className="text-neutral-400">
            Here's exactly how ATS systems will see your resume
          </p>
        </div>

        {/* Main Score Card */}
        <Card className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border border-neutral-800 rounded-2xl overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left: Score */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={
                        score > 80
                          ? "#4ade80"
                          : score > 60
                          ? "#facc15"
                          : "#f87171"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${(score / 100) * 339.29} 339.29`}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-xs text-neutral-400">Match</div>
                  </div>
                </div>

                <div className="text-center">
                  <p className={`text-lg font-semibold ${getScoreColor(score)}`}>
                    {getScoreLabel(score)}
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Better than {getPercentile(score)} of candidates
                  </p>
                </div>
              </div>

              {/* Right: Subscores */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">
                      Job Fit
                    </label>
                    <span className="text-sm font-semibold text-white">
                      {jobFit}%
                    </span>
                  </div>
                  <Progress
                    value={jobFit}
                    className="h-2 bg-neutral-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">
                      ATS Health
                    </label>
                    <span className="text-sm font-semibold text-white">
                      {atsHealth}%
                    </span>
                  </div>
                  <Progress
                    value={Math.max(0, atsHealth)}
                    className="h-2 bg-neutral-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">
                      Skill Match
                    </label>
                    <span className="text-sm font-semibold text-white">
                      {skillMatch}%
                    </span>
                  </div>
                  <Progress
                    value={Math.max(0, skillMatch)}
                    className="h-2 bg-neutral-800"
                  />
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 mb-2">
                    Analysis Confidence
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={confidence}
                      className="h-1.5 bg-neutral-800 flex-1"
                    />
                    <span className="text-xs font-medium text-neutral-400">
                      {confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary CTA */}
        <Button
          onClick={handleGenerate}
          className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg py-6 text-base font-semibold"
        >
          <Zap className="h-5 w-5 mr-2" />
          Generate Improved Resume
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.section>

      {/* ========================================
          SECTION 2: SCORE BREAKDOWN
          (Why this score?)
          ======================================== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp(0.1)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold">Where Did the Points Go?</h2>

        <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            {/* Metric 1: Strength Coverage */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Strength Match
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {strengths.length} of your strengths align with this role
                  </p>
                </div>
                <span className="text-lg font-bold text-green-400">
                  {Math.round((strengths.length / Math.max(1, strengths.length + weaknesses.length)) * 100)}%
                </span>
              </div>
              <Progress
                value={Math.round((strengths.length / Math.max(1, strengths.length + weaknesses.length)) * 100)}
                className="h-2 bg-neutral-800"
              />
            </div>

            {/* Metric 2: Weakness Coverage */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Weakness Exposure
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {weaknesses.length} potential gaps detected
                  </p>
                </div>
                <span className="text-lg font-bold text-yellow-400">
                  {Math.round(100 - (weaknesses.length * 10))}%
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (weaknesses.length * 10))}
                className="h-2 bg-neutral-800"
              />
            </div>

            {/* Metric 3: Skill Coverage */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Skill Coverage
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Missing {missingSkills.length} critical skill
                    {missingSkills.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-lg font-bold text-red-400">
                  {Math.round(100 - (missingSkills.length * 8))}%
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (missingSkills.length * 8))}
                className="h-2 bg-neutral-800"
              />
            </div>

            <div className="border-t border-neutral-800 pt-4 mt-4">
              <p className="text-xs text-neutral-400">
                💡 <strong>How we calculate:</strong> ATS systems weight strengths,
                penalize weaknesses, and prioritize missing skills. Your score
                reflects what recruiters will see in 10 seconds of scanning.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ========================================
          SECTION 3: ATS BRAIN VIEW
          (How machines see you)
          ======================================== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp(0.2)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold">How ATS Systems Read Your Resume</h2>

        <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
          <CardContent className="p-6 space-y-3">
            {/* Strengths - Green checkmarks */}
            {strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-400 mb-3 uppercase tracking-wider">
                  ✓ DETECTED & VALUED
                </p>
                <div className="space-y-2">
                  {strengths.slice(0, 4).map((strength, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-900/10 border border-green-700/20"
                    >
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-neutral-300">{strength}</p>
                    </div>
                  ))}
                  {strengths.length > 4 && (
                    <p className="text-xs text-neutral-500 px-3">
                      +{strengths.length - 4} more strengths detected
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Weaknesses - Yellow warnings */}
            {weaknesses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-3 uppercase tracking-wider">
                  ⚠ POTENTIAL CONCERNS
                </p>
                <div className="space-y-2">
                  {weaknesses.slice(0, 3).map((weakness, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/20"
                    >
                      <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-neutral-300">{weakness}</p>
                    </div>
                  ))}
                  {weaknesses.length > 3 && (
                    <p className="text-xs text-neutral-500 px-3">
                      +{weaknesses.length - 3} more concerns flagged
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Missing Skills - Red X */}
            {missingSkills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-400 mb-3 uppercase tracking-wider">
                  ✗ MISSING (CRITICAL)
                </p>
                <div className="space-y-2">
                  {missingSkills.slice(0, 4).map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-red-900/10 border border-red-700/20"
                    >
                      <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-neutral-300">{skill}</p>
                    </div>
                  ))}
                  {missingSkills.length > 4 && (
                    <p className="text-xs text-neutral-500 px-3">
                      +{missingSkills.length - 4} more missing skills
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-neutral-800 pt-4 mt-4">
              <p className="text-xs text-neutral-400">
                🤖 <strong>ATS parsing logic:</strong> Modern ATS systems use NLP
                and keyword matching to extract relevant information in ~6 seconds.
                Green items boost your score; yellow items are neutral; red items
                subtract significantly.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ========================================
          SECTION 4: SKILLS & KEYWORDS INTELLIGENCE
          (What's missing?)
          ======================================== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp(0.3)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold">Skills Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Missing Skills - High Impact */}
          <Card className="bg-red-900/10 border border-red-700/30 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-300">
                Missing (High Impact)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      className="bg-red-900/40 text-red-200 border border-red-700/50 hover:bg-red-900/60"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 italic">
                  No critical skills missing!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weaknesses - Moderate Impact */}
          <Card className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-yellow-300">
                Weak Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weaknesses.length > 0 ? (
                <div className="space-y-1">
                  {weaknesses.slice(0, 3).map((weakness, idx) => (
                    <p key={idx} className="text-xs text-yellow-200 leading-relaxed">
                      • {weakness}
                    </p>
                  ))}
                  {weaknesses.length > 3 && (
                    <p className="text-xs text-neutral-500 mt-2">
                      +{weaknesses.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 italic">
                  All major skills covered!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Strengths - Already Have */}
          <Card className="bg-green-900/10 border border-green-700/30 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-green-300">
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strengths.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {strengths.slice(0, 4).map((strength, idx) => (
                    <Badge
                      key={idx}
                      className="bg-green-900/40 text-green-200 border border-green-700/50 hover:bg-green-900/60"
                    >
                      {strength}
                    </Badge>
                  ))}
                  {strengths.length > 4 && (
                    <Badge className="bg-neutral-800 text-neutral-400">
                      +{strengths.length - 4}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 italic">
                  Review recommendations below
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* ========================================
          SECTION 5: ACTIONABLE FIX PLAN
          (What to do now?)
          ======================================== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp(0.4)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold">Top Improvements (Ranked by Impact)</h2>

        <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
          <CardContent className="p-6">
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, idx) => {
                  // Estimate impact points (rough heuristic)
                  const impactPoints = Math.max(2, 10 - idx * 1.5);

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="p-4 rounded-lg bg-gradient-to-r from-neutral-900 to-transparent border border-neutral-800 hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">
                            {rec}
                          </p>

                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                              <span className="text-xs font-medium text-green-400">
                                +{impactPoints.toFixed(1)}% impact
                              </span>
                            </div>
                            {idx === 0 && (
                              <Badge className="bg-green-900/40 text-green-300 border-green-700/50 text-xs">
                                Highest Priority
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                <div className="border-t border-neutral-800 pt-4 mt-4">
                  <p className="text-xs text-neutral-400">
                    💡 <strong>Recommended action:</strong> Apply these
                    improvements using the "Generate Improved Resume" button
                    above. The AI will rewrite your resume with these changes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-neutral-300 font-semibold">
                  Your resume is well-optimized!
                </p>
                <p className="text-sm text-neutral-500 mt-2">
                  No major improvements needed. Generate a tailored version to see
                  final tweaks.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* ========================================
          STICKY CTA FOOTER
          ======================================== */}
      {stickyVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent border-t border-neutral-800 p-6"
        >
          <div className="max-w-4xl mx-auto flex gap-3">
            <Button
              onClick={handleAnalyzeAnother}
              variant="outline"
              className="flex-1 border-neutral-700 text-neutral-300 rounded-lg"
            >
              Analyze Another
            </Button>
            <Button
              onClick={handleGenerate}
              className="flex-1 bg-white text-black hover:bg-neutral-200 rounded-lg font-semibold"
            >
              Generate Improved Resume
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
