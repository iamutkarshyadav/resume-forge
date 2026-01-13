"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Upload,
  Zap,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Crown,
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Resume = {
  id: string;
  filename: string;
  createdAt: string;
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

  const userQuery = trpc.auth.me.useQuery(undefined, { retry: 1 });
  const resumeQuery = trpc.resume.list.useQuery(undefined, { retry: 1 });
  const recentMatchesQuery = trpc.activity.getRecentMatches.useQuery(
    { limit: 50 },
    { retry: 1 }
  );
  const creditsQuery = trpc.billing.getUserCredits.useQuery(undefined, {
    retry: 1,
    refetchInterval: 30000, // Poll every 30s for real-time updates
  });
  const metricsQuery = trpc.plan.getMetrics.useQuery(undefined, { retry: 1 });

  const resumes = resumeQuery.data || [];
  const matches = (recentMatchesQuery.data || []) as Match[];
  const credits = creditsQuery.data?.credits || 0;

  const stats = useMemo(() => {
    const allScores = matches.map((m) => m.score || 0).filter((s) => s > 0);
    const averageScore = allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
      : 0;
    const recentMatch = matches[0];
    const activeResume = recentMatch
      ? resumes.find((r) => r.id === recentMatch.resumeId)
      : null;

    return {
      totalScans: matches.length,
      averageScore,
      activeResume,
      recentMatch,
    };
  }, [matches, resumes]);

  useEffect(() => {
    if (userQuery.data) {
      setUser({ name: userQuery.data?.name || "User" });
    } else if (userQuery.isError) {
      setUser({ name: "User" });
    }
  }, [userQuery.data, userQuery.isError]);

  function formatDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const hasResumes = resumes.length > 0;

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome back, <span className="text-muted-foreground">{user?.name || "User"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {hasResumes
                ? `You're on track. Keep analyzing and improving.`
                : "Ready to upload your first resume?"}
            </p>
          </div>
        </header>

        {/* USAGE HEADER */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Download Credits</span>
                <Crown className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold mb-1">{credits}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
              {credits === 0 && (
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => router.push("/billing")}
                >
                  Get Credits
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">ATS Scans</span>
                <Activity className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.totalScans}</p>
              <p className="text-xs text-muted-foreground">Total performed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">ATS Health</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <p className={`text-3xl font-bold ${
                  stats.averageScore >= 80 ? "text-green-600" :
                  stats.averageScore >= 70 ? "text-foreground" :
                  stats.averageScore > 0 ? "text-red-600" :
                  "text-muted-foreground"
                }`}>
                  {stats.averageScore}%
                </p>
                {stats.averageScore >= 80 && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {stats.averageScore > 0 && stats.averageScore < 70 && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <Progress
                value={stats.averageScore}
                className="h-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Average score</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active Resumes</span>
                <FileText className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mb-1">{resumes.length}</p>
              <p className="text-xs text-muted-foreground">In your library</p>
            </CardContent>
          </Card>
        </section>

        {/* ACTIVE PROGRESS ZONE */}
        {stats.recentMatch && stats.activeResume && (
          <section>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      Continue Your Progress
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Finish your resume analysis for better results
                    </p>
                    {stats.recentMatch.score && stats.recentMatch.score < 80 && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {stats.recentMatch.score}% match - Room for improvement
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Review recommendations to boost your ATS score
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => router.push(`/resumes/${stats.activeResume?.id}`)}
                      >
                        Fix Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/analyze")}
                      >
                        Analyze Again
                      </Button>
                    </div>
                  </div>
                  {credits === 0 && (
                    <div className="flex-shrink-0">
                      <Button
                        className="font-semibold"
                        onClick={() => router.push("/billing")}
                      >
                        <Crown className="h-4 w-4 mr-2 text-yellow-600" />
                        Get More Credits
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* RESUME MANAGEMENT FEED */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Management
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/resumes")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hasResumes ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Resume Name
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Last Analysis
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          ATS Score
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Last Updated
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumes
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 5)
                        .map((resume) => {
                          const resumeMatches = matches.filter((m) => m.resumeId === resume.id);
                          const latestMatch = resumeMatches[0];
                          const bestScore = resumeMatches.length > 0
                            ? Math.max(...resumeMatches.map((m) => m.score || 0))
                            : null;

                          return (
                            <tr
                              key={resume.id}
                              className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => router.push(`/resumes/${resume.id}`)}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded border flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm font-medium truncate max-w-xs">
                                    {resume.filename}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-muted-foreground">
                                  {latestMatch?.summary ? (
                                    <span className="truncate max-w-xs block">
                                      {latestMatch.summary}
                                    </span>
                                  ) : (
                                    "Not analyzed"
                                  )}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {bestScore !== null ? (
                                  <span className={`text-sm font-semibold ${
                                    bestScore >= 80 ? "text-green-600" :
                                    bestScore >= 70 ? "text-foreground" :
                                    "text-red-600"
                                  }`}>
                                    {bestScore}%
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(resume.createdAt)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/resumes/${resume.id}`);
                                    }}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/analyze?resumeId=${resume.id}`);
                                    }}
                                  >
                                    Analyze
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No resumes yet</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Upload your resume to begin ATS analysis
                  </p>
                  <Button
                    onClick={() => router.push("/resumes")}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
