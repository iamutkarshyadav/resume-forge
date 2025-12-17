"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Target,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Mock data - in production, this would come from your analytics endpoint
  const mockAnalyses = [
    {
      id: "1",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      score: 72,
      jobTitle: "Frontend Developer",
    },
    {
      id: "2",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      score: 78,
      jobTitle: "Senior Frontend Engineer",
    },
    {
      id: "3",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      score: 85,
      jobTitle: "React Developer",
    },
    {
      id: "4",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      score: 88,
      jobTitle: "Full Stack Engineer",
    },
    {
      id: "5",
      date: new Date(),
      score: 92,
      jobTitle: "Lead Engineer",
    },
  ];

  const stats = useMemo(() => {
    const sorted = [...mockAnalyses].sort((a, b) => a.score - b.score);
    const avg = mockAnalyses.reduce((sum, a) => sum + a.score, 0) / mockAnalyses.length;
    const improvement = mockAnalyses[mockAnalyses.length - 1].score - mockAnalyses[0].score;

    return {
      bestScore: sorted[sorted.length - 1]?.score || 0,
      worstScore: sorted[0]?.score || 0,
      averageScore: Math.round(avg),
      totalAnalyses: mockAnalyses.length,
      improvement,
    };
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              Your Progress
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Track your resume improvement over time
            </p>
          </div>
        </motion.header>

        {/* STATS GRID */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-neutral-950 border border-neutral-800">
            <CardContent className="p-6">
              <p className="text-sm text-neutral-400 mb-2">Best Score</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-green-400">{stats.bestScore}%</p>
                <Badge className="bg-green-900 text-green-300 mb-1">
                  Peak
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-950 border border-neutral-800">
            <CardContent className="p-6">
              <p className="text-sm text-neutral-400 mb-2">Average Score</p>
              <p className="text-3xl font-bold text-blue-400">{stats.averageScore}%</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-950 border border-neutral-800">
            <CardContent className="p-6">
              <p className="text-sm text-neutral-400 mb-2">Improvement</p>
              <div className="flex items-end gap-2">
                <p className={`text-3xl font-bold ${stats.improvement > 0 ? "text-green-400" : "text-red-400"}`}>
                  +{stats.improvement}%
                </p>
              </div>
              <p className="text-xs text-neutral-500 mt-2">From first to last</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-950 border border-neutral-800">
            <CardContent className="p-6">
              <p className="text-sm text-neutral-400 mb-2">Total Analyses</p>
              <p className="text-3xl font-bold text-purple-400">
                {stats.totalAnalyses}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* SCORE TIMELINE */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="bg-neutral-950 border border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Score Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockAnalyses.map((analysis, idx) => {
                  const isLowest = analysis.score === stats.worstScore;
                  const isHighest = analysis.score === stats.bestScore;

                  return (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-24 flex-shrink-0">
                          <p className="text-sm font-medium text-neutral-400">
                            {analysis.date.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {analysis.date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">
                              {analysis.jobTitle}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">
                                {analysis.score}%
                              </span>
                              {isLowest && (
                                <Badge className="bg-red-900 text-red-300 text-xs">
                                  Lowest
                                </Badge>
                              )}
                              {isHighest && (
                                <Badge className="bg-green-900 text-green-300 text-xs">
                                  Highest
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                analysis.score >= 80
                                  ? "bg-green-500"
                                  : analysis.score >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${analysis.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* INSIGHTS */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="bg-neutral-950 border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Key Findings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">✓ Strong upward trend</p>
                <p className="text-xs">Your scores have improved by {stats.improvement}% over time.</p>
              </div>
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">✓ Consistent improvement</p>
                <p className="text-xs">Most recent analysis shows continued growth.</p>
              </div>
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">✓ Well-balanced resume</p>
                <p className="text-xs">Average score of {stats.averageScore}% indicates a strong match.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-950 border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">1. Focus on weak matches</p>
                <p className="text-xs">Identify which job types score lower and target improvements.</p>
              </div>
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">2. Update with new skills</p>
                <p className="text-xs">Add recently acquired skills to boost scores further.</p>
              </div>
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">3. Test more roles</p>
                <p className="text-xs">Analyze against diverse job descriptions to find best fits.</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}
