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
import { trpc } from "@/lib/trpc";
import {
  Download,
  Share2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Sparkles,
  Link2,
  Edit,
  ArrowLeft,
} from "lucide-react";

/**
 * Redesigned Resume Analysis Page
 *
 * Goals:
 * - concise, robust layout
 * - summary + bullets
 * - pros/cons
 * - skills present / missing
 * - actions and preview
 * - defensive rendering + skeleton states
 *
 * Keep using ShadCN components; small motion enhancements.
 */

/* ------------------------------
   Types: mirror what your backend returns
   ------------------------------ */
type Keyword = { name: string; found: boolean; density?: number };
type Metric = { label: string; value: number };
type Suggestion = { id: string; text: string; targetId?: string; priority?: "High" | "Medium" | "Low" };
type TimelineEvent = { id: string; time: string; event: string; completed: boolean };

type JsonDataShape = {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  experience?: any[];
  projects?: any[];
  education?: { institution?: string; degree?: string }[];
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
  pros?: string[]; // optional
  cons?: string[]; // optional
  missingSkills?: string[]; // optional explicit missing skills
};

type ResumeRaw = {
  _id: string;
  filename: string;
  sizeKB?: number;
  fullText?: string;
  jsonData?: JsonDataShape;
  createdAt?: string | { $date?: string } | Date;
};

/* ------------------------------
   Small helpers
   ------------------------------ */
function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}
function formatDateShort(s?: string | Date | { $date?: string }) {
  if (!s) return "N/A";
  try {
    const d = typeof s === "string" ? new Date(s) : (s as any).$date ? new Date((s as any).$date) : (s as Date);
    return d.toLocaleString();
  } catch {
    return String(s);
  }
}

/* ------------------------------
   Internal mini-components
   ------------------------------ */

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-neutral-900 rounded-lg p-4", className)}>
      <div className="h-6 bg-neutral-800 rounded w-1/3 mb-3" />
      <div className="h-4 bg-neutral-800 rounded w-full mb-2" />
      <div className="h-4 bg-neutral-800 rounded w-5/6" />
    </div>
  );
}

function ScoreBadge({ value, label }: { value: number; label?: string }) {
  const pct = clamp(Math.round(value));
  const color = pct > 75 ? "text-emerald-400" : pct > 45 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full w-12 h-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center">
        <div className={cn("text-lg font-semibold", color)}>{pct}</div>
      </div>
      {label && <div className="text-sm text-neutral-400">{label}</div>}
    </div>
  );
}

function BulletList({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <div>
      <div className="text-sm font-medium text-white mb-2">{title}</div>
      <ul className="list-disc list-inside text-sm space-y-1 text-neutral-300">
        {bullets.length > 0 ? bullets.map((b, i) => <li key={i}>{b}</li>) : <li className="text-neutral-500 italic">No items</li>}
      </ul>
    </div>
  );
}

function CompactBadge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-200">{children}</span>;
}

/* ------------------------------
   Main Page
   ------------------------------ */

export default function ResumeRedesignPage() {
  const router = useRouter();
  const pathname = usePathname();
  const resumeId = pathname?.split("/").pop() ?? "";

  // states
  const [targetRole, setTargetRole] = useState<string>("");
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  // fetch resume using trpc (adapt to your router)
  const { data: rawData, isLoading, isError } = trpc.resume.get.useQuery({ resumeId }, { enabled: !!resumeId });
  // fallback normalized object
  const jsonData = useMemo<JsonDataShape>(() => {
    const jd = (rawData as ResumeRaw | undefined)?.jsonData ?? {};
    return {
      name: jd.name ?? rawData?.filename ?? "Unknown",
      email: jd.email,
      phone: jd.phone,
      summary: jd.summary ?? "",
      skills: Array.isArray(jd.skills) ? jd.skills : [],
      experience: Array.isArray(jd.experience) ? jd.experience : [],
      projects: Array.isArray(jd.projects) ? jd.projects : [],
      education: Array.isArray(jd.education) ? jd.education : [],
      previewUrl: jd.previewUrl ?? null,
      score: jd.score ?? 0,
      jobMatchScore: jd.jobMatchScore ?? 0,
      keywords: Array.isArray(jd.keywords) ? jd.keywords : [],
      metrics: Array.isArray(jd.metrics) ? jd.metrics : [],
      suggestions: Array.isArray(jd.suggestions) ? jd.suggestions : [],
      timeline: Array.isArray(jd.timeline) ? jd.timeline : [],
      lastAnalyzed: jd.lastAnalyzed ?? undefined,
      targetRole: jd.targetRole ?? undefined,
      notes: jd.notes ?? undefined,
      pros: Array.isArray(jd.pros) ? jd.pros : [],
      cons: Array.isArray(jd.cons) ? jd.cons : [],
      missingSkills: Array.isArray(jd.missingSkills) ? jd.missingSkills : [],
    };
  }, [rawData]);

  useEffect(() => {
    if (jsonData.targetRole) setTargetRole(jsonData.targetRole);
  }, [jsonData.targetRole]);

  // small refs
  const previewRef = useRef<HTMLDivElement | null>(null);

  // derived values
  const keywordMatchPercent = useMemo(() => {
    const keywords = jsonData.keywords ?? [];
    if (keywords.length === 0) return 0;
    const matched = keywords.filter((k) => k.found).length;
    return Math.round((matched / keywords.length) * 100);
  }, [jsonData.keywords]);

  // actions
  function handleShare() {
    if (navigator.share) {
      navigator
        .share({ title: jsonData.name ?? "Resume", url: window.location.href })
        .catch(() => navigator.clipboard?.writeText(window.location.href));
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  }
  function handleDownload() {
    // stub - replace with actual download route
    const url = jsonData.previewUrl ?? `/api/resumes/${resumeId}/download`;
    window.open(url, "_blank");
  }
  function scrollToPreviewSection(id?: string) {
    if (!previewRef.current || !id) return;
    const el = previewRef.current.querySelector<HTMLElement>(`[data-target-id="${id}"]`);
    if (!el) return;
    previewRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    el.classList.add("resume-redesign-highlight");
    setTimeout(() => el.classList.remove("resume-redesign-highlight"), 1800);
  }

  /* ------------------------------
     Render: loading / error states
     ------------------------------ */
  if (isLoading || !rawData) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <style>
          {`
          .resume-redesign-highlight { outline: 2px solid rgba(255,255,255,0.06); box-shadow: 0 4px 18px rgba(255,255,255,0.02); }
        `}
        </style>
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-semibold">Resume — Loading</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-[900px] mx-auto text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-rose-400 mb-4" />
          <h2 className="text-2xl font-semibold">Failed to load resume</h2>
          <p className="text-neutral-400 mt-2">Something went wrong fetching the resume. Try refreshing or come back later.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => location.reload()}>Retry</Button>
            <Button variant="ghost" onClick={() => router.push("/workspace")}>
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------
     Main Layout
     ------------------------------ */
  const dataSafe = {
    title: (rawData as ResumeRaw)?.filename ?? jsonData.name ?? "Resume",
    uploadedAt: formatDateShort((rawData as any)?.createdAt ?? new Date()),
    score: jsonData.score ?? 0,
    jobMatch: jsonData.jobMatchScore ?? 0,
    keywords: jsonData.keywords ?? [],
    metrics: jsonData.metrics ?? [],
    suggestions: jsonData.suggestions ?? [],
    lastAnalyzed: jsonData.lastAnalyzed ?? "N/A",
    previewUrl: jsonData.previewUrl ?? null,
    summary: jsonData.summary ?? (rawData as any)?.fullText?.slice(0, 300) ?? "",
  };

  /* ------------------------------
     UI
     ------------------------------ */
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <style>
        {`
          .resume-redesign-highlight { animation: resumePulse 1.8s ease-in-out; }
          @keyframes resumePulse {
            0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.00); border-color: rgba(255,255,255,0.04);}
            50% { box-shadow: 0 8px 24px rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.12); }
            100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.00); }
          }
        `}
      </style>

      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight">{dataSafe.title}</h1>
              <CompactBadge>{dataSafe.uploadedAt}</CompactBadge>
            </div>
            <p className="text-sm text-neutral-400 mt-2">Last analyzed: {dataSafe.lastAnalyzed}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-xs text-neutral-400">Target Role</div>
              <div className="flex items-center gap-2">
                <Input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Engineer"
                  className="w-64 bg-neutral-900 border-neutral-800"
                />
                <Button size="sm" variant="ghost" onClick={() => alert("Saved (stub)")}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Avatar className="h-10 w-10 border border-neutral-800 bg-neutral-900">
              {dataSafe.previewUrl ? (
                <AvatarImage src={dataSafe.previewUrl} alt="preview" onError={(e) => (e.currentTarget.src = "")} />
              ) : (
                <AvatarFallback>
                  <FileText className="h-5 w-5" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleShare}>
                <Share2 className="h-4 w-4" /> <span className="hidden md:inline">Share</span>
              </Button>
              <Button variant="default" onClick={handleDownload}>
                <Download className="h-4 w-4" /> <span className="hidden md:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Summary Card */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription>Concise summary, bullets, and quick takeaways</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-300 mb-3">{dataSafe.summary}</p>

                    {/* automatic bullet extraction - naive split by sentences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-neutral-400 mb-2">Bulleted Highlights</div>
                        <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1">
                          {dataSafe.summary
                            .split(".")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .slice(0, 6)
                            .map((s, i) => (
                              <li key={i}>{s}.</li>
                            ))}
                        </ul>
                      </div>

                      <div>
                        <div className="text-xs text-neutral-400 mb-2">Quick Scorecard</div>
                        <div className="flex items-center gap-4">
                          <ScoreBadge value={dataSafe.score} label="Overall Score" />
                          <div>
                            <div className="text-xs text-neutral-400">Job Match</div>
                            <div className="text-lg font-semibold">{dataSafe.jobMatch}%</div>
                            <div className="text-xs text-neutral-500 mt-1">Keywords {keywordMatchPercent}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-neutral-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm font-medium text-white mb-2">Pros</div>
                        <div className="text-sm text-neutral-300">
                          {jsonData.pros?.length ? (
                            <ul className="list-disc list-inside space-y-1">
                              {jsonData.pros.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          ) : (
                            <div className="text-neutral-500 italic">No explicit pros detected</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-white mb-2">Cons / Risks</div>
                        <div className="text-sm text-neutral-300">
                          {jsonData.cons?.length ? (
                            <ul className="list-disc list-inside space-y-1">
                              {jsonData.cons.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          ) : (
                            <div className="text-neutral-500 italic">No major issues detected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* compact actions on the right of summary */}
                  <div className="w-40 flex flex-col gap-3 items-stretch">
                    <div className="text-xs text-neutral-400">Quick Actions</div>
                    <Button size="sm" onClick={() => alert("Optimize (stub)")}>
                      <Sparkles className="h-4 w-4 mr-2" /> Optimize
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => alert("Create ATS copy (stub)")}>
                      ATS Copy
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => alert("Open editor (stub)")}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Missing */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
                <CardDescription>Skills present, missing, and suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-neutral-400 mb-2">Present</div>
                    <div className="flex flex-wrap gap-2">
                      {(jsonData.skills ?? []).length ? (
                        jsonData.skills!.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-neutral-800/60">
                            {s}
                          </span>
                        ))
                      ) : (
                        <div className="text-neutral-500 italic">No skills detected</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-400 mb-2">Missing (Model Suggests)</div>
                    <div className="flex flex-wrap gap-2">
                      {(jsonData.missingSkills ?? []).length ? (
                        jsonData.missingSkills!.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-rose-900/40 text-rose-200">
                            {s}
                          </span>
                        ))
                      ) : (
                        <div className="text-neutral-500 italic">No missing skills suggested</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-400 mb-2">Keyword Match</div>
                    <div className="text-sm font-semibold">{keywordMatchPercent}%</div>
                    <div className="text-xs text-neutral-500 mt-1">Keywords found vs required</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience condensed */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Experience</CardTitle>
                <CardDescription>Condensed achievements & impact bullets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(jsonData.experience ?? []).length ? (
                    (jsonData.experience ?? []).slice(0, 4).map((exp: any, i: number) => (
                      <div key={i} className="p-3 bg-neutral-950/10 rounded-md border border-neutral-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{exp.role ?? exp.title ?? "Role"}</div>
                            <div className="text-xs text-neutral-500">{exp.company ?? ""} • {exp.start ?? ""} {exp.end ? `– ${exp.end}` : ""}</div>
                          </div>
                          <div className="text-xs text-neutral-400">{exp.location ?? ""}</div>
                        </div>
                        <div className="text-sm text-neutral-300 mt-2">
                          {Array.isArray(exp.achievements) ? (
                            <ul className="list-disc list-inside space-y-1">
                              {exp.achievements.slice(0, 3).map((a: string, j: number) => <li key={j}>{a}</li>)}
                            </ul>
                          ) : exp.description ? (
                            <p>{exp.description}</p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-500 italic">No experience data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Actionable Suggestions</CardTitle>
                <CardDescription>Click to locate or auto-apply quick improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dataSafe.suggestions ?? []).length ? (
                    (dataSafe.suggestions ?? []).map((s: Suggestion) => (
                      <div key={s.id} className="p-3 rounded-md border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-white">{s.text}</div>
                          <div className="text-xs text-neutral-400 mt-1">Priority: {s.priority ?? "Medium"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setActiveSuggestionId(s.id); if (s.targetId) scrollToPreviewSection(s.targetId); }}>
                            Highlight
                          </Button>
                          <Button size="sm" onClick={() => alert("Apply suggestion (stub)")}>Apply</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-500 italic">No suggestions</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: preview + timeline + quick meta */}
          <div className="lg:col-span-5 space-y-6">
            {/* Preview */}
            <Card className="bg-[#0b0b0b] border border-neutral-800 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>Click suggestions to jump to the related section</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[620px] bg-[#0b0b0b] border-t border-neutral-800 flex">
                  <div ref={previewRef} className="w-2/3 h-full overflow-auto p-6 bg-[#0f0f0f] border-r border-neutral-800">
                    <div className="mx-auto max-w-[680px]">
                      <div data-target-id="preview-header" className="mb-4 p-3 bg-white rounded text-black">
                        <h2 className="text-xl font-semibold">{jsonData.name ?? dataSafe.title}</h2>
                        <p className="text-sm text-neutral-700">{jsonData.email ?? ""} {jsonData.phone ? `• ${jsonData.phone}` : ""}</p>
                      </div>

                      {jsonData.summary ? (
                        <div data-target-id="preview-summary" className="mb-4 p-3 bg-white rounded text-black">
                          <h3 className="font-semibold">Summary</h3>
                          <p className="text-sm">{jsonData.summary}</p>
                        </div>
                      ) : null}

                      {jsonData.experience && jsonData.experience.length > 0 ? (
                        <div data-target-id="preview-experience" className="mb-4 p-3 bg-white rounded text-black">
                          <h3 className="font-semibold">Experience</h3>
                          <ul className="list-disc ml-5 text-sm space-y-2">
                            {jsonData.experience.map((exp: any, i: number) => (
                              <li key={i} data-target-id={`exp-${i}`}>
                                <div className="font-medium">{exp.role ?? exp.title ?? exp.company ?? "Role"}</div>
                                <div className="text-xs text-neutral-500">{exp.company ?? ""} {exp.start ? `• ${exp.start}` : ""} {exp.end ? `– ${exp.end}` : ""}</div>
                                {Array.isArray(exp.achievements) ? (
                                  <ul className="list-disc ml-5 text-sm">{exp.achievements.map((a: any, j: number) => <li key={j}>{a}</li>)}</ul>
                                ) : exp.description ? <p className="text-sm">{exp.description}</p> : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {jsonData.projects && jsonData.projects.length > 0 ? (
                        <div data-target-id="preview-projects" className="mb-4 p-3 bg-white rounded text-black">
                          <h3 className="font-semibold">Projects</h3>
                          <div className="space-y-2">
                            {jsonData.projects.map((p: any, i: number) => (
                              <div key={i}>
                                <div className="font-medium">{p.title ?? p.name}</div>
                                <div className="text-sm">{p.description ?? ""}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {jsonData.skills && jsonData.skills.length > 0 ? (
                        <div data-target-id="preview-skills" className="mb-4 p-3 bg-white rounded text-black">
                          <h3 className="font-semibold">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {jsonData.skills.map((sk: string, i: number) => <span key={i} className="text-xs px-2 py-1 rounded bg-neutral-200/60 text-black">{sk}</span>)}
                          </div>
                        </div>
                      ) : null}

                      {jsonData.education && jsonData.education.length > 0 ? (
                        <div data-target-id="preview-education" className="mb-4 p-3 bg-white rounded text-black">
                          <h3 className="font-semibold">Education</h3>
                          <div className="text-sm">
                            {jsonData.education.map((e: any, i: number) => (
                              <div key={i}>
                                <div className="font-medium">{e.institution}</div>
                                <div className="text-xs text-neutral-500">{e.degree}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-1/3 h-full p-4 flex flex-col gap-3">
                    <div>
                      <div className="text-xs text-neutral-400">Document</div>
                      <div className="font-medium">{dataSafe.title}</div>
                    </div>

                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={handleDownload}>Download PDF</Button>
                      <Button className="w-full" onClick={() => alert("Save version (stub)")}>Save New Version</Button>
                    </div>

                    <div className="mt-auto">
                      <div className="text-xs text-neutral-400 mb-2">Timeline</div>
                      <ol className="text-sm space-y-3">
                        {jsonData.timeline && jsonData.timeline.length ? (
                          jsonData.timeline.map((t: TimelineEvent) => (
                            <li key={t.id} className="flex items-start gap-3">
                              <div className="mt-1">{t.completed ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Clock className="h-4 w-4 text-neutral-500" />}</div>
                              <div>
                                <div className="text-sm">{t.event}</div>
                                <div className="text-xs text-neutral-400">{t.time}</div>
                              </div>
                            </li>
                          ))
                        ) : (
                          <div className="text-neutral-500 italic">No timeline events</div>
                        )}
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta & Small Metrics */}
            <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Meta & Metrics</CardTitle>
                <CardDescription>Compact insight and quick links</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-950/10 rounded-md border border-neutral-800">
                    <div className="text-xs text-neutral-400">Overall</div>
                    <div className="text-lg font-semibold">{dataSafe.score}</div>
                  </div>
                  <div className="p-3 bg-neutral-950/10 rounded-md border border-neutral-800">
                    <div className="text-xs text-neutral-400">Job Match</div>
                    <div className="text-lg font-semibold">{dataSafe.jobMatch}%</div>
                  </div>
                  <div className="p-3 bg-neutral-950/10 rounded-md border border-neutral-800">
                    <div className="text-xs text-neutral-400">Keywords</div>
                    <div className="text-lg font-semibold">{keywordMatchPercent}%</div>
                  </div>
                  <div className="p-3 bg-neutral-950/10 rounded-md border border-neutral-800">
                    <div className="text-xs text-neutral-400">Last Analyzed</div>
                    <div className="text-sm">{jsonData.lastAnalyzed ?? "N/A"}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" onClick={() => router.push("/workspace")}>Back</Button>
                  <Button variant="outline" onClick={() => alert("Share externally (stub)")}>External Share</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   Exports (small helpers that may be moved to shared lib)
   ------------------------------ */

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
