"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText,
  Upload,
  ChevronRight,
  Zap,
  Activity,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { QuickMatchDialog } from "@/components/QuickMatchDialog";
import { PlanUsageCard } from "@/components/PlanUsageCard";

type Resume = {
  id: string;
  filename: string;
  createdAt: string;
  jsonData?: any;
};

type Match = {
  id: string;
  resumeId?: string;
  score?: number;
  summary?: string;
  createdAt: string;
};

export default function CommandCenterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showQuickMatch, setShowQuickMatch] = useState(false);

  // Fetch user profile and activity data
  const userQuery = trpc.auth.me.useQuery();
  const resumeQuery = trpc.resume.list.useQuery();
  const activityQuery = trpc.activity.getDashboardSummary.useQuery();
  const recentMatchesQuery = trpc.activity.getRecentMatches.useQuery({ limit: 3 });

  const [insight, setInsight] = useState({
    text: "Upload your resume to get started with AI-powered matching and analysis.",
  });

  useEffect(() => {
    if (!userQuery.data) return;
    setUser({ name: userQuery.data?.name || "User" });
  }, [userQuery.data]);

  useEffect(() => {
    if (!resumeQuery.data) return;
    setResumes(resumeQuery.data as Resume[]);
  }, [resumeQuery.data]);

  useEffect(() => {
    if (!recentMatchesQuery.data) return;
    setMatches(
      recentMatchesQuery.data.map((m: any) => ({
        id: m.id,
        resumeId: m.resumeId,
        score: m.score,
        summary: m.summary || "Analysis complete",
        createdAt: m.createdAt,
      }))
    );
  }, [recentMatchesQuery.data]);

  useEffect(() => {
    // Update insight based on recent matches
    if (recentMatchesQuery.data && recentMatchesQuery.data.length > 0) {
      const avgScore = Math.round(
        recentMatchesQuery.data.reduce((sum: number, m: any) => sum + (m.score || 0), 0) / recentMatchesQuery.data.length
      );
      setInsight({
        text: `Your recent matches score ${avgScore}% on average. Keep refining your resume to match job descriptions more closely.`,
      });
    }
  }, [recentMatchesQuery.data]);

  function timeAgo(iso?: string) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER: Greeting + CTAs */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight">
              Good evening, <span className="text-neutral-400">{user?.name || "User"}</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              {resumes.length === 0
                ? "Ready to upload your first resume?"
                : `You have ${resumes.length} resume${resumes.length !== 1 ? "s" : ""}. Ready to match?`}
            </p>
          </div>

          <Avatar className="h-12 w-12 border border-neutral-800">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </motion.header>

        {/* PRIMARY CTAs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex gap-3"
        >
          <Button
            onClick={() => setShowQuickMatch(true)}
            className="bg-white text-black hover:bg-neutral-200 rounded-lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Match
          </Button>
          <Button
            onClick={() => router.push("/resumes")}
            variant="outline"
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-900 rounded-lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Resume
          </Button>
        </motion.div>

        {/* YOUR RESUMES SECTION */}
        {resumes.length > 0 && (
          <motion.section initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Your Resumes</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-white"
                    onClick={() => router.push("/resumes")}
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {resumes.slice(0, 3).map((resume) => {
                    const lastMatch = matches.find(
                      (m) => m.resumeId === resume.id
                    );
                    return (
                      <motion.div
                        key={resume.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
                        onClick={() => router.push(`/resumes/${resume.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-neutral-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {resume.filename}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {timeAgo(resume.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {lastMatch?.score && (
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {lastMatch.score}%
                              </p>
                              <p className="text-xs text-neutral-500">
                                Best Score
                              </p>
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/analyze");
                            }}
                          >
                            Analyze
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* RECENT ACTIVITY */}
        {matches.length > 0 && (
          <motion.section initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-white"
                    onClick={() => router.push("/history")}
                  >
                    View History
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {matches.slice(0, 3).map((match, idx) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-900 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mt-1">
                        <Activity className="h-4 w-4 text-neutral-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-100">
                          {match.summary}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {timeAgo(match.createdAt)}
                        </p>
                      </div>
                      {match.score && (
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {match.score}%
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* PLAN USAGE */}
        <PlanUsageCard />

        {/* INSIGHT SECTION */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-2">AI Insight</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {insight.text}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-white mt-3"
                    onClick={() => router.push("/analyze")}
                  >
                    Get Recommendations
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Quick Match Dialog */}
      <QuickMatchDialog open={showQuickMatch} onOpenChange={setShowQuickMatch} />
    </main>
  );
}
