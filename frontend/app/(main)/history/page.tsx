"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Match = {
  id: string;
  resumeId?: string;
  score?: number;
  summary?: string;
  createdAt: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const recentMatchesQuery = trpc.activity.getRecentMatches.useQuery({ limit: 100 });

  useEffect(() => {
    if (recentMatchesQuery.data) {
      const formattedMatches = recentMatchesQuery.data.map((m: any) => ({
        id: m.id,
        resumeId: m.resumeId,
        score: m.score,
        summary: m.summary || "Analysis complete",
        createdAt: m.createdAt,
      }));
      setMatches(formattedMatches);
    }
  }, [recentMatchesQuery.data]);

  // Group by date for timeline
  const timeline = useMemo(() => {
    const grouped: { [key: string]: Match[] } = {};
    matches.forEach((match) => {
      const date = new Date(match.createdAt);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    return grouped;
  }, [matches]);

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const dateGroups = Object.keys(timeline).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Calculate usage stats
  const stats = useMemo(() => {
    const scores = matches.map((m) => m.score || 0).filter((s) => s > 0);
    return {
      total: matches.length,
      average: scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0,
      best: scores.length > 0 ? Math.max(...scores) : 0,
    };
  }, [matches]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight">History</h1>
            <p className="text-sm text-neutral-400 mt-2">
              ATS scan history and usage timeline
            </p>
          </div>
        </header>

        {/* STATS */}
        {matches.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-neutral-800 bg-black p-4">
              <p className="text-sm text-neutral-400 mb-1">Total Scans</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="border border-neutral-800 bg-black p-4">
              <p className="text-sm text-neutral-400 mb-1">Average Score</p>
              <p className={`text-2xl font-bold ${
                stats.average >= 80 ? "text-green-500" :
                stats.average >= 70 ? "text-white" :
                "text-red-500"
              }`}>
                {stats.average}%
              </p>
            </div>
            <div className="border border-neutral-800 bg-black p-4">
              <p className="text-sm text-neutral-400 mb-1">Best Score</p>
              <p className="text-2xl font-bold text-white">{stats.best}%</p>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        <section className="space-y-8">
          {matches.length === 0 ? (
            <Card className="bg-black border border-neutral-800">
              <CardContent className="p-12 text-center">
                <BarChart2 className="h-12 w-12 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-400 mb-4">
                  No analyses yet. Start by analyzing a resume against a job description.
                </p>
                <Button
                  onClick={() => router.push("/analyze")}
                  className="bg-white text-black hover:bg-neutral-200 cursor-pointer"
                >
                  Analyze Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-800" />

              {dateGroups.map((dateGroup, groupIdx) => (
                <div key={dateGroup} className="relative mb-8">
                  {/* Date header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-2 w-2 rounded-full bg-white border-2 border-black relative z-10" />
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                      {dateGroup}
                    </h3>
                  </div>

                  {/* Entries for this date */}
                  <div className="ml-6 space-y-2">
                    {timeline[dateGroup].map((match, idx) => (
                      <Card
                        key={match.id}
                        className="bg-black border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                        onClick={() =>
                          setExpanded(expanded === match.id ? null : match.id)
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="h-8 w-8 rounded border border-neutral-800 flex items-center justify-center flex-shrink-0">
                                <BarChart2 className="h-4 w-4 text-neutral-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate max-w-md">
                                  {match.summary}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {timeAgo(match.createdAt)}
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className={`text-lg font-semibold ${
                                (match.score || 0) >= 80 ? "text-green-500" :
                                (match.score || 0) >= 70 ? "text-white" :
                                "text-red-500"
                              }`}>
                                {match.score || 0}%
                              </p>
                              <p className="text-xs text-neutral-500">Match</p>
                            </div>
                          </div>

                          {/* Score bar */}
                          {match.score && (
                            <div className="mt-3 pt-3 border-t border-neutral-800">
                              <div className="w-full bg-neutral-900 h-1">
                                <div
                                  className={`h-1 ${
                                    match.score >= 80 ? "bg-green-500" :
                                    match.score >= 70 ? "bg-white" :
                                    "bg-red-500"
                                  }`}
                                  style={{ width: `${match.score}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
