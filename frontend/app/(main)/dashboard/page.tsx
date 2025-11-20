"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table"; // if table exists in shadcn; fallback to div rows if not
import {
  Search,
  ChevronRight,
  FileText,
  BarChart3,
  Clock,
  Sparkles,
  Upload,
  Settings,
  PieChart,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Resume = {
  id: string;
  title: string;
  updatedAt: string;
  score?: number;
};

type TimelineItem = {
  id: string;
  type: "upload" | "analyze" | "insight";
  label: string;
  time: string;
  meta?: string;
};

export default function UltraMinimalDashboard() {
  // ------------------------------
  // Local placeholder state (replace with API)
  // ------------------------------
  const [user, setUser] = useState({ name: "Utkarsh", avatar: "/placeholder.svg" });
  const [query, setQuery] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [scoreTrend, setScoreTrend] = useState<number[]>([68, 72, 78, 85, 92]);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 2, 1, 3, 4, 0, 2]);
  const [selectedMetric, setSelectedMetric] = useState<"score" | "activity" | "uploads">("score");
  const [insight, setInsight] = useState<{ text?: string; updatedAt?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Greeting could be computed here for header but we only need name in state
    // TODO: Replace placeholders with real API calls (minimal payloads)
    const placeholderResumes: Resume[] = [
      { id: "r1", title: "Senior Software Engineer.pdf", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), score: 92 },
      { id: "r2", title: "Frontend Developer Resume.pdf", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), score: 84 },
      { id: "r3", title: "DevOps Resume.pdf", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), score: 76 },
    ];
    setResumes(placeholderResumes);

    setTimeline([
      { id: "t1", type: "upload", label: "Uploaded Senior Software Engineer.pdf", time: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), meta: "2d ago" },
      { id: "t2", type: "analyze", label: "Analyzed Senior Software Engineer.pdf", time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), meta: "2d ago" },
      { id: "t3", type: "insight", label: "Copilot suggested adding 'distributed systems'", time: new Date().toISOString(), meta: "1h ago" },
    ]);

    setInsight({ text: "Add 'distributed systems' and 'Kafka' to skillset for platform roles.", updatedAt: new Date().toISOString() });

    // Score trend and weekly activity placeholders above
  }, []);

  // Derived values
  const totalResumes = resumes.length;
  const avgScore = useMemo(() => {
    if (!resumes.length) return 0;
    const s = resumes.reduce((a, r) => a + (r.score ?? 0), 0);
    return Math.round(s / resumes.length);
  }, [resumes]);

  const latestMatch = useMemo(() => {
    if (!resumes.length) return 0;
    const sorted = [...resumes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted[0].score ?? 0;
  }, [resumes]);

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

  // ------------------------------
  // Tiny SVG: sparkline (for header)
  // ------------------------------
  const Sparkline: React.FC<{ values: number[]; width?: number; height?: number }> = ({ values, width = 120, height = 34 }) => {
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 100);
    const pad = 4;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const coords = values.map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * innerW;
      const y = pad + (1 - (v - min) / (max - min || 1)) * innerH;
      return { x, y };
    });
    const d = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="none" className="inline-block">
        <path d={d} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // ------------------------------
  // ScoreLineChart (bigger)
  // ------------------------------
  const ScoreLineChart: React.FC<{ values: number[] }> = ({ values }) => {
    const width = 760;
    const height = 170;
    const pad = 12;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 100);
    const coords = values.map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * innerW;
      const y = pad + (1 - (v - min) / (max - min || 1)) * innerH;
      return { x, y, v };
    });
    const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const areaD = pathD + ` L ${pad + innerW} ${pad + innerH} L ${pad} ${pad + innerH} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="170" preserveAspectRatio="none">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>
        </defs>

        <path d={areaD} fill="url(#area)" stroke="none" />
        <line x1={pad} x2={pad + innerW} y1={pad + innerH} y2={pad + innerH} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        <motion.path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4.5 : 2.4} fill={i === coords.length - 1 ? "#10B981" : "rgba(255,255,255,0.18)"} />
        ))}
      </svg>
    );
  };

  // ------------------------------
  // WeeklyBarChart
  // ------------------------------
  const WeeklyBarChart: React.FC<{ values: number[] }> = ({ values }) => {
    const width = 760;
    const height = 80;
    const pad = 8;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const max = Math.max(...values, 1);
    const barW = innerW / values.length;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        {values.map((v, i) => {
          const x = pad + i * barW + barW * 0.12;
          const bw = barW * 0.76;
          const h = (v / max) * innerH;
          const y = pad + innerH - h;
          const active = v > 0;
          return (
            <motion.rect
              key={i}
              x={x}
              y={y}
              width={bw}
              rx={4}
              height={h}
              fill={active ? "rgba(255,255,255,0.36)" : "rgba(255,255,255,0.12)"}
              initial={{ height: 0, y: pad + innerH }}
              animate={{ height: h, y }}
              transition={{ delay: i * 0.04, duration: 0.36 }}
            />
          );
        })}
      </svg>
    );
  };

  // ------------------------------
  // Animations variants
  // ------------------------------
  const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header / Sparkline */}
        <motion.header initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Good evening, <span className="text-neutral-400">{user.name}</span></h1>
            <p className="text-sm text-neutral-500 mt-1">Here’s a quick pulse of your workspace.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800">
              <span className="text-xs text-neutral-400 mr-2">7d</span>
              <Sparkline values={scoreTrend} />
            </div>

            <Avatar className="h-9 w-9 border border-neutral-800">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </motion.header>

        {/* Key metrics row (dense) */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <Card className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <CardContent className="p-0">
              <div className="text-xs uppercase text-neutral-400 tracking-wider">Resumes Created</div>
              <div className="mt-2 text-xl font-semibold">{totalResumes}</div>
              <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-2">
                <span className="inline-flex items-center gap-2">
                  <BarChart3 className="h-3 w-3 text-neutral-400" />
                  <span>Recent</span>
                </span>
                <div className="ml-auto"><Sparkline values={weeklyActivity.map((v) => (v * 20) + 40)} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <CardContent className="p-0">
              <div className="text-xs uppercase text-neutral-400 tracking-wider">Average Match</div>
              <div className="mt-2 text-xl font-semibold">{avgScore}%</div>
              <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-2">
                <span className="inline-flex items-center gap-2">
                  {avgScore >= 80 ? <ChevronUp className="h-3 w-3 text-green-400" /> : <ChevronDown className="h-3 w-3 text-yellow-400" />}
                  <span>Trend</span>
                </span>
                <div className="ml-auto text-neutral-500 text-xs">Last 30d</div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <CardContent className="p-0">
              <div className="text-xs uppercase text-neutral-400 tracking-wider">JD Analyses</div>
              <div className="mt-2 text-xl font-semibold">12</div>
              <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-2">
                <PieChart className="h-3 w-3 text-neutral-400" />
                <span className="ml-1">Last week</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <CardContent className="p-0">
              <div className="text-xs uppercase text-neutral-400 tracking-wider">Last Active</div>
              <div className="mt-2 text-xl font-semibold">{resumes[0] ? timeAgo(resumes[0].updatedAt) : "—"}</div>
              <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-2">
                <Clock className="h-3 w-3 text-neutral-400" />
                <span className="ml-1">Recent action</span>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Two-column split: Activity timeline (left) / Weekly performance (right) */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LEFT: Activity Timeline (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Activity Timeline</h3>
                  <div className="text-xs text-neutral-400">Recent events</div>
                </div>

                <div className="space-y-3">
                  {timeline.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                          {t.type === "upload" && <Upload className="h-4 w-4 text-neutral-400" />}
                          {t.type === "analyze" && <Activity className="h-4 w-4 text-neutral-400" />}
                          {t.type === "insight" && <Sparkles className="h-4 w-4 text-neutral-400" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-100">{t.label}</div>
                        <div className="text-xs text-neutral-500">{t.meta} • {timeAgo(t.time)}</div>
                      </div>
                      <div className="text-xs text-neutral-400">{/* maybe a status chip */}</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Weekly Performance */}
          <div className="">
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Weekly Performance</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMetric("score")}
                      className={cn("px-2 py-1 rounded-md text-xs", selectedMetric === "score" ? "bg-white text-black" : "text-neutral-400")}
                      aria-pressed={selectedMetric === "score"}
                    >
                      Score
                    </button>
                    <button
                      onClick={() => setSelectedMetric("activity")}
                      className={cn("px-2 py-1 rounded-md text-xs", selectedMetric === "activity" ? "bg-white text-black" : "text-neutral-400")}
                      aria-pressed={selectedMetric === "activity"}
                    >
                      Activity
                    </button>
                    <button
                      onClick={() => setSelectedMetric("uploads")}
                      className={cn("px-2 py-1 rounded-md text-xs", selectedMetric === "uploads" ? "bg-white text-black" : "text-neutral-400")}
                      aria-pressed={selectedMetric === "uploads"}
                    >
                      Uploads
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  {selectedMetric === "score" ? (
                    <>
                      <ScoreLineChart values={scoreTrend} />
                      <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
                        <div>Score Trend — last analyses</div>
                        <div className="text-neutral-100 font-medium">{scoreTrend[scoreTrend.length - 1]}%</div>
                      </div>
                    </>
                  ) : selectedMetric === "activity" ? (
                    <>
                      <WeeklyBarChart values={weeklyActivity} />
                      <div className="text-xs text-neutral-400 mt-2">Weekly activity — days you edited or uploaded</div>
                    </>
                  ) : (
                    <>
                      <WeeklyBarChart values={weeklyActivity.map((v) => (v > 0 ? 1 : 0))} />
                      <div className="text-xs text-neutral-400 mt-2">Uploads per day</div>
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-neutral-500">Tip: Focus on score peaks — they indicate keywords that worked.</div>
                  <div className="text-xs text-neutral-400">7d</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Resume Hub (compact table) */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Resume Hub</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="text-neutral-400 text-xs" onClick={() => { /* TODO: navigate */ }}>
                    View All
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button className="rounded-xl bg-white text-black text-xs" onClick={() => { /* TODO: open upload modal */ }}>
                    <FileText className="h-4 w-4 mr-2" /> Upload Resume
                  </Button>
                </div>
              </div>

              {/* table / list */}
              <div className="divide-y divide-white/6">
                {resumes.map((r, i) => (
                  <div key={r.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-neutral-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.title}</div>
                        <div className="text-xs text-neutral-500">{timeAgo(r.updatedAt)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{r.score ?? "—"}%</div>
                        <div className="text-xs text-neutral-500">Score</div>
                      </div>

                      <Button variant="outline" size="sm" className="text-neutral-300 border-neutral-700 text-xs" onClick={() => { /* TODO: open resume view */ }}>
                        View
                      </Button>

                      <Button size="sm" className="bg-white text-black text-xs rounded-lg" onClick={() => { /* TODO: navigate to analyze */ }}>
                        Analyze
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* AI Suggestions */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">AI Suggestions</h3>
                  <p className="text-xs text-neutral-400 mt-2 max-w-xl">{insight.text ?? "No suggestions right now."}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="rounded-full px-3 py-1 bg-neutral-900 border border-neutral-800 text-xs">Skills</div>
                    <div className="rounded-full px-3 py-1 bg-neutral-900 border border-neutral-800 text-xs">ATS</div>
                    <div className="rounded-full px-3 py-1 bg-neutral-900 border border-neutral-800 text-xs">Grammar</div>
                    <div className="rounded-full px-3 py-1 bg-neutral-900 border border-neutral-800 text-xs">Job Fit</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="ghost" className="text-neutral-400 text-xs" onClick={() => { /* TODO: open full insight */ }}>
                    View Insights
                  </Button>
                  <Button className="rounded-xl bg-white text-black text-xs" onClick={() => { /* TODO: open copilot modal */ }}>
                    Ask Copilot
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer micro-tools */}
        <footer className="mt-10 flex items-center justify-between text-xs text-neutral-500">
          <div>© {new Date().getFullYear()} ResumeAI</div>

          <div className="flex items-center gap-4">
            <button className="text-neutral-400 hover:text-white" aria-label="settings" onClick={() => { /* TODO */ }}>
              <Settings className="h-4 w-4" />
            </button>
            <button className="text-neutral-400 hover:text-white" aria-label="activity" onClick={() => { /* TODO */ }}>
              <Activity className="h-4 w-4" />
            </button>
            <button className="text-neutral-400 hover:text-white" aria-label="reports" onClick={() => { /* TODO */ }}>
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
