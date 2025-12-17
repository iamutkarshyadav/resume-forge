"use client";

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart2, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc"

type Match = {
  id: string;
  resumeId?: string;
  score?: number;
  summary?: string;
  jdText?: string;
  createdAt: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const recentMatchesQuery = trpc.activity.getRecentMatches.useQuery({ limit: 50 });

  useEffect(() => {
    if (recentMatchesQuery.data) {
      const formattedMatches = recentMatchesQuery.data.map((m: any) => ({
        id: m.id,
        resumeId: m.resumeId,
        score: m.score,
        summary: m.summary || "Analysis complete",
        jdText: "",
        createdAt: m.createdAt,
      }));
      setMatches(formattedMatches);
    }
  }, [recentMatchesQuery.data]);

  function groupByDate(items: Match[]) {
    const grouped: { [key: string]: Match[] } = {};

    items.forEach((item) => {
      const date = new Date(item.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label = "";
      if (date.toDateString() === today.toDateString()) {
        label = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        label = "This Week";
      } else if (date.getTime() > today.getTime() - 30 * 24 * 60 * 60 * 1000) {
        label = "This Month";
      } else {
        label = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      }

      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(item);
    });

    return grouped;
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const groupedMatches = groupByDate(matches);
  const dateGroups = Object.keys(groupedMatches);

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
          <h1 className="text-3xl font-semibold">Past Analyses</h1>
        </motion.header>

        {/* TIMELINE */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-8"
        >
          {matches.length === 0 ? (
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-12 text-center">
                <BarChart2 className="h-12 w-12 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-400">
                  No analyses yet. Start by analyzing a resume against a job
                  description.
                </p>
                <Button
                  onClick={() => router.push("/analyze")}
                  className="mt-4 bg-white text-black hover:bg-neutral-200 rounded-lg"
                >
                  Analyze Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            dateGroups.map((dateGroup, groupIdx) => (
              <div key={dateGroup} className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                  {dateGroup}
                </h3>

                <div className="space-y-2">
                  {groupedMatches[dateGroup].map((match, idx) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (groupIdx * 3 + idx) * 0.04 }}
                    >
                      <Card
                        className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer rounded-lg"
                        onClick={() =>
                          setExpanded(
                            expanded === match.id ? null : match.id
                          )
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
                                <BarChart2 className="h-5 w-5 text-neutral-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {match.summary}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {timeAgo(match.createdAt)}
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-semibold">
                                {match.score}%
                              </p>
                              <p className="text-xs text-neutral-500">
                                Match Score
                              </p>
                            </div>
                          </div>

                          {/* EXPANDED DETAILS */}
                          {expanded === match.id && (
                            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                              <div>
                                <p className="text-xs text-neutral-400 mb-2">
                                  Job Description Preview
                                </p>
                                <p className="text-sm text-neutral-300">
                                  {match.jdText?.substring(0, 200)}...
                                </p>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-neutral-700 text-neutral-300 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/analyze?matchId=${match.id}`);
                                  }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push("/analyze");
                                  }}
                                >
                                  Reanalyze
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </motion.section>
      </div>
    </main>
  );
}
