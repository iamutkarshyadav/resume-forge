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
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Fetch data with proper error handling
  const userQuery = trpc.auth.me.useQuery(undefined, {
    retry: 1,
  });
  const resumeQuery = trpc.resume.list.useQuery(undefined, {
    retry: 1,
  });
  const recentMatchesQuery = trpc.activity.getRecentMatches.useQuery(
    { limit: 5 },
    {
      retry: 1,
    }
  );
  const onboardingQuery = trpc.onboarding.getStatus.useQuery(undefined, {
    retry: 1,
  });

  // Gracefully handle missing or loading onboarding
  const onboarding = onboardingQuery.data || { isNew: false, isOnboarding: false };

  useEffect(() => {
    if (userQuery.data) {
      setUser({ name: userQuery.data?.name || "User" });
    } else if (userQuery.isError) {
      // Gracefully handle user fetch error
      setUser({ name: "User" });
    }
  }, [userQuery.data, userQuery.isError]);

  useEffect(() => {
    if (resumeQuery.data) {
      setResumes(resumeQuery.data as Resume[]);
    } else if (resumeQuery.isError) {
      // Gracefully handle resume fetch error
      setResumes([]);
    }
  }, [resumeQuery.data, resumeQuery.isError]);

  useEffect(() => {
    if (recentMatchesQuery.data) {
      setMatches(
        recentMatchesQuery.data.map((m: any) => ({
          id: m.id,
          resumeId: m.resumeId,
          score: m.score,
          summary: m.summary || "Analysis complete",
          createdAt: m.createdAt,
        }))
      );
    } else if (recentMatchesQuery.isError) {
      // Gracefully handle matches fetch error
      setMatches([]);
    }
  }, [recentMatchesQuery.data, recentMatchesQuery.isError]);

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

  const isNewUser = onboarding?.isNew;
  const hasResumes = resumes.length > 0;
  const hasAnalyses = matches.length > 0;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome back, <span className="text-neutral-400">{user?.name || "User"}</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              {isNewUser
                ? "Let's get your resume ready for the world"
                : hasResumes
                ? `You're on track. Keep analyzing and improving.`
                : "Ready to upload your first resume?"}
            </p>
          </div>

          <Avatar className="h-12 w-12 border border-neutral-800">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </motion.header>

        {/* ONBOARDING CHECKLIST (New Users Only) */}
        {onboarding && onboarding.isOnboarding && (
          <OnboardingChecklist status={onboarding} />
        )}

        {/* QUICK ACTIONS */}
        {!isNewUser && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors rounded-2xl cursor-pointer group"
              onClick={() => router.push("/resumes")}
              data-onboarding="upload">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-neutral-800">
                    <FileText className="h-5 w-5 text-neutral-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">Resumes</h3>
                <p className="text-sm text-neutral-400 mb-4">
                  {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
                </p>
                <Button size="sm" className="bg-white text-black hover:bg-neutral-200 rounded-lg w-full">
                  Manage
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors rounded-2xl cursor-pointer group"
              onClick={() => router.push("/analyze")}
              data-onboarding="analyze">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-neutral-800">
                    <Zap className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">Analyze</h3>
                <p className="text-sm text-neutral-400 mb-4">
                  Run match analysis
                </p>
                <Button size="sm" className="bg-white text-black hover:bg-neutral-200 rounded-lg w-full">
                  Start
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors rounded-2xl cursor-pointer group"
              onClick={() => router.push("/history")}
              data-onboarding="history">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-neutral-800">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">History</h3>
                <p className="text-sm text-neutral-400 mb-4">
                  {hasAnalyses ? "View your analyses" : "No data yet"}
                </p>
                <Button size="sm" className="bg-white text-black hover:bg-neutral-200 rounded-lg w-full" disabled={!hasAnalyses}>
                  View
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* RESUMES SECTION */}
        {hasResumes && (
          <motion.section initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Resumes</h2>
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

                <div className="space-y-2">
                  {resumes.slice(0, 3).map((resume) => {
                    const lastMatch = matches.find((m) => m.resumeId === resume.id);
                    return (
                      <motion.div
                        key={resume.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
                        onClick={() => router.push(`/resumes/${resume.id}`)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-neutral-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {resume.filename}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {timeAgo(resume.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {lastMatch?.score && (
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {lastMatch.score}%
                              </p>
                              <p className="text-xs text-neutral-500">
                                Best match
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
        {hasAnalyses && (
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
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {matches.slice(0, 3).map((match, idx) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-900 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="h-4 w-4 text-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-100">
                          {match.summary}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {timeAgo(match.createdAt)}
                        </p>
                      </div>
                      {match.score && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-green-400">
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

        {/* EMPTY STATE FOR NEW USERS */}
        {isNewUser && !onboarding?.isOnboarding && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center py-12"
          >
            <p className="text-neutral-400 mb-4">
              You're all set! Start by uploading your first resume.
            </p>
            <Button
              onClick={() => router.push("/resumes")}
              className="bg-white text-black hover:bg-neutral-200 rounded-lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </motion.section>
        )}
      </div>
    </main>
  );
}
