"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Target,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function ProgressPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Fetch real analytics data
  const { data: recentMatches = [], isLoading } = trpc.activity.getRecentMatches.useQuery({ limit: 50 });

  // Calculate stats from real data
  const stats = useMemo(() => {
    if (recentMatches.length === 0) {
      return {
        bestScore: 0,
        worstScore: 0,
        averageScore: 0,
        totalAnalyses: 0,
        improvement: 0,
        hasEnoughData: false,
      };
    }

    const scores = recentMatches
      .map((m: any) => m.score || 0)
      .sort((a: number, b: number) => a - b);

    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const improvement = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

    return {
      bestScore: scores[scores.length - 1] || 0,
      worstScore: scores[0] || 0,
      averageScore: Math.round(avg),
      totalAnalyses: recentMatches.length,
      improvement,
      hasEnoughData: recentMatches.length >= 3,
    };
  }, [recentMatches]);

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12 text-neutral-400">
            Loading your progress data...
          </div>
        </div>
      </main>
    );
  }

  if (!stats.hasEnoughData) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto space-y-6">
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
            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              Your Progress
            </h1>
          </motion.header>

          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-12 w-12 text-neutral-700 mx-auto mb-4 opacity-50" />
                <p className="text-neutral-400 mb-2">
                  Not enough data yet to show progress.
                </p>
                <p className="text-sm text-neutral-500 mb-6">
                  Complete at least 3 resume analyses to see your progress and improvement trends.
                </p>
                <Button
                  onClick={() => router.push("/analyze")}
                  className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                >
                  Analyze Your First Resume
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>
    );
  }

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
              Track your resume improvement over {stats.totalAnalyses} analyses
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
                  {stats.improvement > 0 ? "+" : ""}{stats.improvement}%
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
                {recentMatches.map((analysis: any, idx: number) => {
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
                            {new Date(analysis.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {new Date(analysis.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">
                              {analysis.summary || "Analysis"}
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
              {stats.improvement >= 10 && (
                <div className="text-sm text-neutral-400">
                  <p className="font-medium text-white mb-1">✓ Strong upward trend</p>
                  <p className="text-xs">Your scores have improved by {stats.improvement}% overall.</p>
                </div>
              )}
              {stats.averageScore >= 75 && (
                <div className="text-sm text-neutral-400">
                  <p className="font-medium text-white mb-1">✓ Well-matched resume</p>
                  <p className="text-xs">Average score of {stats.averageScore}% indicates strong alignment with target roles.</p>
                </div>
              )}
              {stats.averageScore < 75 && stats.averageScore >= 50 && (
                <div className="text-sm text-neutral-400">
                  <p className="font-medium text-white mb-1">✓ Room for improvement</p>
                  <p className="text-xs">Focus on the recommendations from your analyses to boost your average score.</p>
                </div>
              )}
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">✓ Consistent effort</p>
                <p className="text-xs">You've completed {stats.totalAnalyses} analyses. Keep refining!</p>
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
              {stats.averageScore < 75 && (
                <div className="text-sm text-neutral-400">
                  <p className="font-medium text-white mb-1">1. Review weaknesses</p>
                  <p className="text-xs">Check your past analyses for common weaknesses and missing skills.</p>
                </div>
              )}
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">
                  {stats.averageScore < 75 ? "2. " : "1. "}Update your resume
                </p>
                <p className="text-xs">Add skills and experiences that match your target job descriptions.</p>
              </div>
              <div className="text-sm text-neutral-400">
                <p className="font-medium text-white mb-1">
                  {stats.averageScore < 75 ? "3. " : "2. "}Test more roles
                </p>
                <p className="text-xs">Analyze against diverse positions to find the best fit.</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}
