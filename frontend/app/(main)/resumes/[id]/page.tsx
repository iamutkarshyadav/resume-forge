"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Download,
  Share2,
  Clock,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

/**
 * Types based on your DB output
 */
type Keyword = { name: string; found: boolean; density?: number };
type Metric = { label: string; value: number };
type Suggestion = { id: string; text: string; targetId: string; priority: "High" | "Medium" | "Low" };
type TimelineEvent = { id: string; time: string; event: string; completed: boolean };

type JsonDataShape = {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[]; // the DB returns a flattened array — we'll normalize
  experience?: any[]; // might be empty
  projects?: any[];
  education?: { institution?: string; degree?: string }[];
  path?: string; // "uploads\\file.pdf"
  previewUrl?: string | null;
  score?: number;
  jobMatchScore?: number;
  keywords?: Keyword[];
  metrics?: Metric[];
  suggestions?: Suggestion[];
  timeline?: TimelineEvent[];
  lastAnalyzed?: string;
  targetRole?: string;
  notes?: string;
};

type ResumeRaw = {
  _id: string;
  filename: string;
  sizeKB: number;
  fullText?: string;
  jsonData?: JsonDataShape;
  uploadedById?: string;
  createdAt?: string | { $date?: string } | Date;
};

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function formatDateShort(s?: string | Date | { $date?: string }) {
  try {
    if (!s) return "";
    const d = typeof s === "string" ? new Date(s) : (s as any).$date ? new Date((s as any).$date) : (s as Date);
    return d.toLocaleString();
  } catch {
    return String(s);
  }
}

function LargeScoreCircle({ value, size = 120, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const dash = (clamp(value) / 100) * c;
  const center = size / 2;

  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${center}, ${center})`}>
          <circle r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="transparent" />
          <circle
            r={radius}
            stroke="#fff"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform="rotate(-90)"
            fill="transparent"
          />
        </g>
      </svg>
      <div className="absolute text-center pointer-events-none">
        <div className="text-3xl font-semibold">{value}</div>
        <div className="text-xs text-neutral-400">/ 100</div>
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = clamp(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white">{label}</div>
        <div className="text-sm font-medium text-white">{pct}%</div>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-2 bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KeywordChip({ name, density, found }: { name: string; density?: number; found: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-3 h-3 rounded-full", found ? "bg-white" : "border border-white/40 bg-transparent")} />
      <div className="text-sm">
        <span className="text-white">{name}</span>
        {typeof density !== "undefined" && <span className="text-neutral-400 text-xs"> ({density}%)</span>}
      </div>
    </div>
  );
}

function SuggestionRow({ s, onHighlight }: { s: Suggestion; onHighlight: (s: Suggestion) => void }) {
  return (
    <div className="p-3 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {s.priority === "High" ? <AlertTriangle className="h-5 w-5 text-white" /> : <Sparkles className="h-5 w-5 text-white/90" />}
        </div>
        <div>
          <div className="text-sm text-white">{s.text}</div>
          <div className="text-xs text-neutral-400 mt-1">Priority: {s.priority}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onHighlight(s)}>
          Highlight
        </Button>
        <Button variant="outline" size="sm" onClick={() => alert("Apply (stub)")}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function PreviewBlock({ children, targetId, className = "" }: { children: React.ReactNode; targetId?: string; className?: string }) {
  return (
    <div data-target-id={targetId} className={cn("mb-4 p-3 bg-white rounded shadow-sm text-black", className)} style={{ minHeight: 48 }}>
      {children}
    </div>
  );
}

export default function ResumeAnalysisPage() {
  const router = useRouter();
  const pathname = usePathname();
  const resumeId = pathname.split("/").pop() ?? "";

  const [targetRole, setTargetRole] = useState<string>("");
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  // fetch the resume - rawData should match what you pasted
  const { data: rawData, isLoading, isError } = trpc.resume.get.useQuery({ resumeId }, { enabled: !!resumeId });

  // Normalize json data and provide strong typed defaults
  const jsonData = useMemo<JsonDataShape>(() => {
    const jd = (rawData as ResumeRaw | undefined)?.jsonData ?? {};
    // normalize path -> previewUrl
    const path = jd.path ?? jd["path"] ?? jd.previewUrl ?? null;
    // convert backslashes to forward slashes if needed
    let normalizedPreview: string | null = null;
    if (typeof path === "string") {
      // if path looks like uploads\123-file.pdf convert to /uploads/123-file.pdf
      normalizedPreview = path.replace(/\\\\/g, "/").replace(/\\/g, "/");
      // If it already looks like a preview URL (starts with http or /) keep it
      if (!normalizedPreview.startsWith("/") && !/^https?:\/\//.test(normalizedPreview)) {
        normalizedPreview = `/${normalizedPreview}`;
      }
    } else {
      normalizedPreview = null;
    }

    // ensure skills array: backend had a flattened array with headings — try to sanitize
    const rawSkills = Array.isArray(jd.skills) ? jd.skills : [];
    // heuristic: filter out entries that are headings like "PROJECTS" or very short tokens
    const skills = rawSkills.filter((s: string) => typeof s === "string" && s.trim().length > 1 && !/^(PROJECTS|EXPERIENCE|SKILLS|EDUCATION)$/i.test(s.trim()));

    return {
      name: jd.name ?? jd["title"] ?? rawData?.filename ?? "Unknown",
      email: jd.email,
      phone: jd.phone,
      summary: jd.summary ?? jd?.summary?.trim() ?? rawData?.fullText?.slice(0, 300) ?? "",
      skills,
      experience: Array.isArray(jd.experience) ? jd.experience : [],
      projects: Array.isArray(jd.projects) ? jd.projects : [],
      education: Array.isArray(jd.education) ? jd.education : [],
      path: jd.path ?? undefined,
      previewUrl: normalizedPreview,
      score: jd.score ?? 0,
      jobMatchScore: jd.jobMatchScore ?? 0,
      keywords: Array.isArray(jd.keywords) ? jd.keywords : [],
      metrics: Array.isArray(jd.metrics) ? jd.metrics : [],
      suggestions: Array.isArray(jd.suggestions) ? jd.suggestions : [],
      timeline: Array.isArray(jd.timeline) ? jd.timeline : [],
      lastAnalyzed: jd.lastAnalyzed ?? undefined,
      targetRole: jd.targetRole ?? undefined,
      notes: jd.notes ?? undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  useEffect(() => {
    if (jsonData.targetRole) setTargetRole(jsonData.targetRole);
  }, [jsonData.targetRole]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // safe fallback object for rendering while data is ready
  const dataSafe = {
    title: rawData?.filename ?? jsonData.name ?? "Resume",
    uploadedAt: formatDateShort((rawData as any)?.createdAt ?? (rawData as any)?.createdAt?.$date ?? new Date()),
    score: jsonData.score ?? 0,
    jobMatchScore: jsonData.jobMatchScore ?? 0,
    status: jsonData ? "Analyzed" : "Pending",
    keywords: jsonData.keywords ?? [],
    metrics: jsonData.metrics ?? [],
    suggestions: jsonData.suggestions ?? [],
    timeline: jsonData.timeline ?? [],
    lastAnalyzed: jsonData.lastAnalyzed ?? "N/A",
    targetRole: jsonData.targetRole ?? (rawData as any)?.jsonData?.targetRole ?? "",
    summary: jsonData.summary ?? "",
    skills: jsonData.skills ?? [],
    experience: jsonData.experience ?? [],
    projects: jsonData.projects ?? [],
    education: jsonData.education ?? [],
    previewUrl: jsonData.previewUrl ?? null,
    fullText: (rawData as any)?.fullText ?? "",
    notes: jsonData.notes ?? "",
  };

  const keywordMatchPercent = useMemo(() => {
    const total = (dataSafe.keywords?.length || 1);
    const matched = (dataSafe.keywords ?? []).filter((k: any) => k.found).length;
    return Math.round((matched / total) * 100);
  }, [dataSafe.keywords]);

  const chartKeywordsData = useMemo(() => {
    return {
      labels: (dataSafe.keywords ?? []).map((k: any) => k.name ?? ""),
      datasets: [
        {
          label: "Keyword density",
          data: (dataSafe.keywords ?? []).map((k: any) => k.density ?? 0),
          borderColor: "#fff",
          backgroundColor: "rgba(255,255,255,0.06)",
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    };
  }, [dataSafe.keywords]);

  function highlightSuggestion(s: Suggestion) {
    setActiveSuggestion(s.id);
    const container = previewRef.current;
    if (!container) return;

    const target = container.querySelector<HTMLElement>(`[data-target-id="${s.targetId}"]`);
    if (!target) {
      container.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSuggestion(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentScroll = container.scrollTop;
    const offset = targetRect.top - containerRect.top + currentScroll - 24;
    container.scrollTo({ top: offset, behavior: "smooth" });

    target.classList.add("resume-highlight-flash");

    if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      target.classList.remove("resume-highlight-flash");
      setActiveSuggestion(null);
    }, 2200);
  }

  const highlightCSS = `
    @keyframes resumeFlash {
      0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.00); border-color: rgba(255,255,255,0.04); }
      30% { box-shadow: 0 0 0 6px rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.18); }
      60% { box-shadow: 0 0 0 10px rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); }
      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.00); border-color: rgba(255,255,255,0.06); }
    }
    .resume-highlight-flash { animation: resumeFlash 2s ease-in-out forwards; border-style: dashed !important; border-width: 1px !important; border-color: rgba(255,255,255,0.12) !important; }
  `;

  if (isLoading || !rawData) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <style>{highlightCSS}</style>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-900 border border-neutral-700 mb-4">
            <Sparkles className="h-8 w-8 text-white/90" />
          </div>
          <div className="text-xl font-semibold">Analyzing resume…</div>
          <div className="text-neutral-400 mt-2">Preparing the detailed report — one sec.</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-semibold text-red-500">Error</div>
          <div className="text-neutral-400 mt-2">Failed to load analysis. Please try again later.</div>
        </div>
      </div>
    );
  }

  // determine preview display: image if previewUrl present and image-like; otherwise show file fallback
  const previewUrl = dataSafe.previewUrl;
  const isPreviewImage = !!previewUrl && /\.(png|jpg|jpeg|webp|svg)$/i.test(previewUrl);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <style>{highlightCSS}</style>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Resume Analysis</h1>
            <p className="text-neutral-400 mt-2">
              <span className="font-medium">{dataSafe.title}</span> • Uploaded {dataSafe.uploadedAt} • Status:{" "}
              <span className="text-white">{dataSafe.status}</span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">Last analyzed: {dataSafe.lastAnalyzed}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs text-neutral-400">Target Role</p>
              <p className="font-medium">{targetRole || dataSafe.targetRole || "Not set"}</p>
            </div>

            <div>
              <Avatar className="h-10 w-10 border border-neutral-700 bg-neutral-900">
                {isPreviewImage && previewUrl ? (
                  <AvatarImage src={previewUrl as string} alt="preview" onError={(e) => (e.currentTarget.src = "")} />
                ) : (
                  <AvatarFallback>
                    <FileText className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                <Share2 className="h-4 w-4" /> <span className="hidden md:inline">Share</span>
              </Button>
              <Button variant="default" onClick={() => alert("Download report (stub)")}>
                <Download className="h-4 w-4" /> <span className="hidden md:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Score & Key Metrics */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <LargeScoreCircle value={dataSafe.score} size={128} stroke={10} />
                    <div>
                      <div className="flex gap-10">
                        <div>
                          <div className="text-xs text-neutral-400">Job Match</div>
                          <div className="text-2xl font-semibold">{dataSafe.jobMatchScore}%</div>
                        </div>

                        <div>
                          <div className="text-xs text-neutral-400">Keyword Match</div>
                          <div className="text-2xl font-semibold">{keywordMatchPercent}%</div>
                        </div>
                      </div>

                      <div className="mt-4 max-w-xl text-sm text-neutral-400">
                        {dataSafe.notes || dataSafe.summary || "No summary available."}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 items-start md:items-end">
                    <Label className="text-xs text-neutral-400">Targeting</Label>
                    <Input
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-72 bg-neutral-900 border-neutral-800 text-white"
                    />

                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" onClick={() => alert("Edit resume (stub)")}>
                        Edit Resume
                      </Button>

                      <Button variant="ghost" onClick={() => alert("Create optimized copy (stub)")}>
                        Create Optimized Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Detailed Score Breakdown</CardTitle>
                <CardDescription>Granular scoring across key dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dataSafe.metrics.length > 0 ? (
                    dataSafe.metrics.map((m) => (
                      <div key={m.label} className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <MetricBar label={m.label} value={m.value} />
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-400">No metric data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Keyword Optimization */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Targeted Keyword Optimization</CardTitle>
                <CardDescription>Matched vs Missing keywords for the target role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-neutral-900/60 rounded-lg border border-neutral-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Matched Keywords</div>
                        <div className="text-xs text-neutral-400">Keywords present in resume</div>
                      </div>

                      <div className="text-xs text-neutral-400">{(dataSafe.keywords || []).filter((k: any) => k.found).length} found</div>
                    </div>

                    <div className="space-y-3">
                      {(dataSafe.keywords || []).filter((k: any) => k.found).map((k: any) => (
                        <div key={k.name} className="flex items-center justify-between">
                          <KeywordChip name={k.name} density={k.density} found={true} />
                          <div className="text-xs text-neutral-400">{k.density ?? 0}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900/60 rounded-lg border border-neutral-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Missing Keywords</div>
                        <div className="text-xs text-neutral-400">Keywords to add</div>
                      </div>

                      <div className="text-xs text-neutral-400">{(dataSafe.keywords || []).filter((k: any) => !k.found).length} missing</div>
                    </div>

                    <div className="space-y-3">
                      {(dataSafe.keywords || []).filter((k: any) => !k.found).map((k: any) => (
                        <div key={k.name} className="flex items-center justify-between">
                          <KeywordChip name={k.name} density={k.density} found={false} />
                          <div className="text-xs text-neutral-400">—</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm text-neutral-400 mb-2">Density Heatmap</div>
                  <div className="w-full h-36 bg-[#111111] border border-neutral-800 rounded-md flex items-center justify-center text-sm text-neutral-500">
                    Density Heatmap (thumbnail)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actionable Suggestions */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Actionable Feedback & Suggestions</CardTitle>
                <CardDescription>Click a suggestion to highlight the relevant location in the preview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <button className="px-3 py-1 rounded-md text-sm bg-white/6">Content & Impact</button>
                  <button className="px-3 py-1 rounded-md text-sm text-neutral-300">Structure & Format</button>
                  <button className="px-3 py-1 rounded-md text-sm text-neutral-300">Grammar & Tone</button>
                </div>

                <div className="space-y-3">
                  {dataSafe.suggestions.length > 0 ? (
                    dataSafe.suggestions.map((s: Suggestion) => <SuggestionRow key={s.id} s={s} onHighlight={highlightSuggestion} />)
                  ) : (
                    <div className="text-neutral-400">No suggestions available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Preview, Actions, Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-[#0b0b0b] border border-neutral-800 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Resume Preview</CardTitle>
                <CardDescription>Click a suggestion to locate and highlight the relevant section</CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <div className="h-[640px] bg-[#0b0b0b] border-t border-neutral-800 flex">
                  <div ref={previewRef} className="w-2/3 h-full overflow-auto p-6 bg-[#111111] border-r border-neutral-800">
                    <div className="mx-auto max-w-[720px]">
                      {/* Build preview from backend if available; otherwise fall back to fullText split */}
                      <PreviewBlock targetId="preview-header">
                        <h2 className="text-xl font-semibold">{jsonData.name ?? dataSafe.title}</h2>
                        <p className="text-sm text-neutral-700">{jsonData.summary ? jsonData.summary.split("\n")[0] : ""}</p>
                      </PreviewBlock>

                      {jsonData.summary ? (
                        <PreviewBlock targetId="preview-summary">
                          <h3 className="font-semibold">Summary</h3>
                          <p className="text-sm">{jsonData.summary}</p>
                        </PreviewBlock>
                      ) : dataSafe.fullText ? (
                        <PreviewBlock targetId="preview-summary">
                          <h3 className="font-semibold">Summary</h3>
                          <p className="text-sm">{dataSafe.fullText.slice(0, 500)}</p>
                        </PreviewBlock>
                      ) : null}

                      {jsonData.experience && jsonData.experience.length > 0 ? (
                        <PreviewBlock targetId="preview-experience">
                          <h3 className="font-semibold">Experience</h3>
                          <ul className="list-disc ml-5 text-sm space-y-2">
                            {jsonData.experience.map((exp: any, i: number) => (
                              <li key={i} data-target-id={`exp-${i}`}>
                                <div className="font-medium">{exp.role ?? exp.title ?? exp.company ?? "Role"}</div>
                                <div className="text-xs text-neutral-500">{exp.company ?? ""} {exp.start ? `• ${exp.start}` : ""} {exp.end ? `– ${exp.end}` : ""}</div>
                                {Array.isArray(exp.achievements) ? <ul className="list-disc ml-5 text-sm">{exp.achievements.map((a: any, j: number) => <li key={j}>{a}</li>)}</ul> : exp.description ? <p className="text-sm">{exp.description}</p> : null}
                              </li>
                            ))}
                          </ul>
                        </PreviewBlock>
                      ) : null}

                      {jsonData.projects && jsonData.projects.length > 0 ? (
                        <PreviewBlock targetId="preview-projects">
                          <h3 className="font-semibold">Projects</h3>
                          <div className="space-y-2">
                            {jsonData.projects.map((p: any, i: number) => (
                              <div key={i}>
                                <div className="font-medium">{p.title ?? p.name}</div>
                                <div className="text-sm">{p.description ?? ""}</div>
                              </div>
                            ))}
                          </div>
                        </PreviewBlock>
                      ) : null}

                      {jsonData.skills && jsonData.skills.length > 0 ? (
                        <PreviewBlock targetId="preview-skills">
                          <h3 className="font-semibold">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {jsonData.skills.map((sk: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-1 rounded bg-neutral-800/40">{sk}</span>
                            ))}
                          </div>
                        </PreviewBlock>
                      ) : null}

                      {jsonData.education && jsonData.education.length > 0 ? (
                        <PreviewBlock targetId="preview-education">
                          <h3 className="font-semibold">Education</h3>
                          <div className="text-sm">
                            {jsonData.education.map((e: any, i: number) => (
                              <div key={i}>
                                <div className="font-medium">{e.institution}</div>
                                <div className="text-xs text-neutral-500">{e.degree}</div>
                              </div>
                            ))}
                          </div>
                        </PreviewBlock>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-1/3 h-full p-4 flex flex-col gap-4">
                    <div>
                      <div className="text-xs text-neutral-400">Document</div>
                      <div className="font-medium">{dataSafe.title}</div>
                    </div>

                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={() => alert("Download as PDF (stub)")}>
                        Download as PDF
                      </Button>
                      <Button variant="default" className="w-full" onClick={() => alert("Save new version (stub)")}>
                        Save New Version
                      </Button>
                    </div>

                    <div className="mt-auto">
                      <div className="text-xs text-neutral-400 mb-2">Timeline</div>
                      <ol className="text-sm space-y-3">
                        {dataSafe.timeline.length > 0 ? (
                          dataSafe.timeline.map((t: TimelineEvent) => (
                            <li key={t.id} className="flex items-start gap-3">
                              <div className="mt-1">{t.completed ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Clock className="h-4 w-4 text-neutral-500" />}</div>
                              <div>
                                <div className="text-sm">{t.event}</div>
                                <div className="text-xs text-neutral-400">{t.time}</div>
                              </div>
                            </li>
                          ))
                        ) : (
                          <div className="text-neutral-400">No timeline events.</div>
                        )}
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-neutral-400">All changes are local. Use Save New Version to persist edits.</div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push("/workspace")}>
                  Back
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alert("Open editor (stub)")}>
                  Open Editor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* helper small components retained from your original file - optional exports for reuse */
export function MiniStat({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-900 rounded-md border border-neutral-800">
      <div className="p-2 rounded-md bg-neutral-800">{icon}</div>
      <div>
        <div className="text-xs text-neutral-400">{title}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

export function Panel({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("bg-neutral-900 border border-neutral-800 rounded-2xl", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-neutral-400">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export const Blocks = {
  LargeScoreCircle,
  MetricBar,
  KeywordChip,
  SuggestionRow,
  PreviewBlock,
  MiniStat,
  Panel,
};
