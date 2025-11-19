"use client";

/**
 * DaVinciDashboard — Single-file, polished, black & white SaaS page
 *
 * Usage:
 *   - Save as: app/(main)/dashboard/hero-resumes-art.tsx
 *   - Requires: shadcn/ui components (button, input, card, avatar, progress, separator, etc.)
 *   - Requires lucide-react and framer-motion
 *
 * What's fixed and improved:
 *   - TypeScript-friendly animation configs (no variant typing errors)
 *   - Stabilized list rendering (no flicker, stable keys)
 *   - Cursor:pointer applied to interactive elements
 *   - Single-file components with internal helpers
 *   - Accessibility attributes added (aria-labels)
 *
 * TODO:
 *   - Replace mock data with API / trpc calls
 *   - Wire Upload -> POST /api/v1/files/upload
 *   - Implement analyze/generate endpoints
 */

import React, { JSX, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";

// shadcn ui components (paths may vary depending on your project structure — adjust if needed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// icons
import {
  Search,
  FileUp,
  PlusCircle,
  FileText,
  BarChart3,
  Brain,
  Sparkles,
  Settings,
  Clock,
  Download,
  Trash2,
  CheckCircle,
  Zap,
  AlertTriangle,
  FileBadge,
  MoreHorizontal,
  Home,
  User,
  Crown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ClipboardList,
  MessageSquare,
  FileCode,
  Briefcase,
} from "lucide-react";

/* ===========================================================================
   UTILITIES & HELPERS
   =========================================================================== */

/** small utility for classname joining (tiny replacement for cn) */
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** human friendly date/time (uses date-fns for strict relative) */
function humanAgo(iso?: string) {
  if (!iso) return "";
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return new Date(iso).toLocaleString();
  }
}

/** friendly date/time formatting */
function humanDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** tiny uid */
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ===========================================================================
   TYPES & MOCK DATA (replace with API responses)
   =========================================================================== */

type ResumeStatus = "parsed" | "processing" | "scanned" | "failed";

type Resume = {
  id: string;
  title: string;
  uploadedAt: string;
  pages: number;
  sizeKB: number;
  score?: number | null;
  status: ResumeStatus;
  filename?: string;
  // add other metadata fields if needed
};

const MOCK_RESUMES: Resume[] = [
  {
    id: "r_001",
    title: "Utkarsh Yadav — Full-Stack Engineer",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    pages: 2,
    sizeKB: 120,
    score: 92,
    status: "parsed",
    filename: "utkarsh_resume.pdf",
  },
  {
    id: "r_002",
    title: "Design Portfolio — Visual Designer",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    pages: 4,
    sizeKB: 450,
    score: 78,
    status: "parsed",
    filename: "designer_portfolio.pdf",
  },
  {
    id: "r_003",
    title: "Scanned Resume — Carlos",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    pages: 1,
    sizeKB: 980,
    score: null,
    status: "scanned",
    filename: "scanned_carlos.pdf",
  },
  {
    id: "r_004",
    title: "Junior Backend Resume",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70).toISOString(),
    pages: 3,
    sizeKB: 220,
    score: 84,
    status: "parsed",
    filename: "junior_backend.pdf",
  },
];

/* ===========================================================================
   FRAMER MOTION VARIANTS (typed, using bezier easing)
   =========================================================================== */

/**
 * Use numeric bezier easing arrays to satisfy Framer Motion TS typing.
 * This avoids 'ease: "easeOut"' type issues.
 */
const easing: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: easing },
  },
};

const staggerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easing } },
  exit: { opacity: 0, y: 6, transition: { duration: 0.22, ease: easing } },
};

/* ===========================================================================
   UI SUB-COMPONENTS — kept inside file for single-file deliverable
   =========================================================================== */

/** Small status badge component */
function StatusBadge({ status }: { status: ResumeStatus }) {
  const base = "text-xs font-medium px-2 py-0.5 rounded";
  const map: Record<ResumeStatus, string> = {
    parsed: "bg-white/6 text-white",
    processing: "bg-white/3 text-neutral-200",
    scanned: "bg-white/4 text-neutral-200",
    failed: "bg-transparent text-neutral-400",
  };
  return <span className={cn(base, map[status])}>{status}</span>;
}

/** Stat tile used in header */
function StatTile({ label, value, hint, icon }: { label: string; value: string | number; hint?: string; icon?: React.ReactNode }) {
  return (
    <Card className="rounded-xl border border-white/6 bg-black/10 p-4 cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-white/6">{icon}</div>
        <div>
          <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
          {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
        </div>
      </div>
    </Card>
  );
}

/* ===========================================================================
   MAIN PAGE — polished, optimized, stable
   =========================================================================== */

export default function DaVinciDashboardPage(): JSX.Element {
  // state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState({ used: 4, limit: 10 });
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [sort, setSort] = useState<"newest" | "oldest" | "score">("newest");

  // a stable ref to prevent re-render flicker on animations
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    // initial load: replace with API call
    setLoading(true);
    const t = setTimeout(() => {
      setResumes(MOCK_RESUMES);
      setLoading(false);
    }, 400);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
    };
  }, []);

  // derived filtered and sorted list — memoize to reduce re-renders
  const filtered = useMemo(() => {
    let list = resumes.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || (r.filename ?? "").toLowerCase().includes(q));
    }

    if (sort === "newest") {
      list.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    } else if (sort === "oldest") {
      list.sort((a, b) => +new Date(a.uploadedAt) - +new Date(b.uploadedAt));
    } else if (sort === "score") {
      list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }

    return list;
  }, [resumes, query, sort]);

  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  /* =========================================================================
     HANDLERS (placeholders — wire to your APIs)
     ========================================================================= */

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function selectAll(checked: boolean) {
    const map: Record<string, boolean> = {};
    resumes.forEach((r) => (map[r.id] = checked));
    setSelected(map);
  }

  function deleteSelected() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) {
      window.alert("Select one or more resumes first.");
      return;
    }
    if (!confirm(`Delete ${ids.length} resume(s)? This action is irreversible in demo.`)) return;
    setResumes((prev) => prev.filter((r) => !ids.includes(r.id)));
    setSelected({});
  }

  function handleUploadFile(file?: File | null) {
    // Replace: POST to /api/v1/files/upload (authenticated)
    const newResume: Resume = {
      id: uid("r"),
      title: file?.name ?? `Uploaded Resume ${new Date().toLocaleTimeString()}`,
      uploadedAt: new Date().toISOString(),
      pages: Math.max(1, Math.ceil((file?.size ?? 120000) / 100000)),
      sizeKB: file ? Math.round(file.size / 1024) : 120,
      status: "processing",
      score: null,
      filename: file?.name,
    };
    setResumes((r) => [newResume, ...r]);
    setUploaderOpen(false);

    // simulate server processing
    setTimeout(() => {
      setResumes((list) =>
        list.map((x) => (x.id === newResume.id ? { ...x, status: "parsed", score: 78 + Math.floor(Math.random() * 18) } : x))
      );
    }, 1200 + Math.random() * 1200);
  }

  function analyzeSelected() {
    const id = Object.keys(selected).find((k) => selected[k]);
    if (!id) {
      window.alert("Pick a resume (select checkbox) to analyze.");
      return;
    }
    // TODO: call /api/v1/match/analyze with resumeId
    window.alert(`Calling analyze API for resume ${id} — wire this to /api/v1/match/analyze`);
  }

  function generateForSelected() {
    const id = Object.keys(selected).find((k) => selected[k]);
    if (!id) {
      window.alert("Choose a resume first.");
      return;
    }
    // TODO: call /api/v1/match/generate
    window.alert(`Calling generate API for resume ${id} — wire this to /api/v1/match/generate`);
  }

  /* =========================================================================
     RENDER SUB-COMPONENTS
     ========================================================================= */

  function ResumeRow({ r }: { r: Resume }) {
    return (
      <motion.div
        layout
        variants={rowVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        key={r.id}
        className="rounded-xl border border-white/6 bg-black/10 p-3 flex items-center gap-4 justify-between"
        role="row"
        title={r.filename || r.title}
      >
        <div className="flex items-center gap-3">
          <input
            aria-label={`Select ${r.title}`}
            type="checkbox"
            checked={!!selected[r.id]}
            onChange={() => toggleSelect(r.id)}
            className="cursor-pointer"
          />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/6 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-neutral-400">{r.pages} pages • {Math.round(r.sizeKB)} KB</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-neutral-400">{humanDate(r.uploadedAt)}</div>

          <div className="flex items-center gap-3">
            {typeof r.score === "number" ? (
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">{r.score}</div>
                <div className="w-28">
                  <Progress value={r.score} className="h-2 bg-white/6" />
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">No score</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => window.alert(`View ${r.id} — implement viewer`)} className="cursor-pointer">View</Button>
            <Button size="sm" variant="outline" onClick={() => analyzeSelected()} className="cursor-pointer">Analyze</Button>
            <Button size="sm" variant="destructive" onClick={() => {
              if (!confirm("Delete this resume?")) return;
              setResumes((s) => s.filter(x => x.id !== r.id));
            }} className="cursor-pointer"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* =========================================================================
     STABLE LIST RENDERING — avoid flicker:
       - useAnimatePresence for controlled enter/exit
       - minimal keys (resumes have stable id)
       - don't aggressively re-create list nodes
     ========================================================================= */

  /* =========================================================================
     PAGE LAYOUT
     ========================================================================= */

  return (
    <main className="min-h-screen bg-black text-white antialiased selection:bg-white/10">
      {/* container */}
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8">

        {/* HERO */}
        <motion.header variants={fadeInUpVariants} initial="hidden" animate="show" className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 border border-white/6 cursor-pointer">
              <AvatarImage src="/avatar-placeholder.png" alt="avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Good afternoon, <span className="text-neutral-300">Utkarsh</span>
              </h1>
              <p className="mt-2 text-neutral-400 max-w-2xl">
                Black & white resume command center. Upload, parse, analyze, and produce job-winning resumes with surgical AI.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button className="bg-white text-black rounded-xl px-4 py-2 cursor-pointer" onClick={() => setUploaderOpen(true)}>Upload Resume</Button>
                <Button variant="ghost" onClick={() => window.alert("Open Resume Builder (TODO)")} className="cursor-pointer">Create New</Button>
                <Button variant="outline" onClick={() => window.alert("Templates (TODO)")} className="cursor-pointer">Templates</Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search resumes, keywords..."
                className="pl-10 bg-neutral-900 border-neutral-800"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search resumes"
              />
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Credits: {credits.used}/{credits.limit}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">AI Credits</div>
                        <div className="text-xs text-neutral-400">Used for resume generation & ATS analysis</div>
                      </div>
                      <div className="text-sm font-semibold">{credits.used}/{credits.limit}</div>
                    </div>
                    <Progress value={(credits.used / credits.limit) * 100} className="h-2 bg-white/6" />
                    <div className="flex justify-between">
                      <Button size="sm" onClick={() => window.alert("Upgrade (TODO)")} className="cursor-pointer">Upgrade</Button>
                      <Button size="sm" variant="link" onClick={() => window.alert("Buy credits (TODO)")} className="cursor-pointer">Buy Credits</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" onClick={() => window.alert("Notifications (TODO)")} className="cursor-pointer">
                <Clock className="h-4 w-4 mr-2" /> Activity
              </Button>

              <div className="h-10 w-10 rounded-full border border-white/6 flex items-center justify-center cursor-pointer">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </motion.header>

        <Separator className="bg-white/6" />

        {/* QUICK ACTIONS + STATS */}
        <motion.section variants={staggerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div variants={fadeInUpVariants} className="md:col-span-2">
            <Card className="rounded-2xl border border-white/6 p-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription className="text-sm text-neutral-400">Common actions to get you moving</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/6 p-4 bg-black/6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">Upload Resume</div>
                        <div className="text-xs text-neutral-400 mt-1">Upload a PDF or DOCX and let the parser do the rest.</div>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-white/6 flex items-center justify-center">
                        <FileUp className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => setUploaderOpen(true)} className="cursor-pointer">Upload File</Button>
                      <Button variant="ghost" onClick={() => window.alert("Drag & drop Uploader (TODO)")} className="cursor-pointer">Drag & drop</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/6 p-4 bg-black/6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">Create New</div>
                        <div className="text-xs text-neutral-400 mt-1">Start from an empty canvas or a template.</div>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-white/6 flex items-center justify-center">
                        <PlusCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => window.alert("Open builder (TODO)")} className="cursor-pointer">Start New</Button>
                      <Button variant="ghost" onClick={() => window.alert("Open templates (TODO)")} className="cursor-pointer">Templates</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/6 p-4 bg-black/6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">AI Analysis</div>
                        <div className="text-xs text-neutral-400 mt-1">Instant feedback & ATS scoring.</div>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-white/6 flex items-center justify-center">
                        <Sparkles className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => analyzeSelected()} className="cursor-pointer">Analyze</Button>
                      <Button variant="ghost" onClick={() => window.alert("AI insights (TODO)")} className="cursor-pointer">Insights</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/6 p-4 bg-black/6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">Analytics</div>
                        <div className="text-xs text-neutral-400 mt-1">Trends, keywords, and hire probability.</div>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-white/6 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => window.alert("Open analytics (TODO)")} className="cursor-pointer">View Reports</Button>
                      <Button variant="ghost" onClick={() => window.alert("Export CSV (TODO)")} className="cursor-pointer">Export</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* stats tiles */}
          <motion.div variants={fadeInUpVariants} className="grid grid-cols-1 gap-4">
            <StatTile label="Resumes" value={resumes.length} hint="Active" icon={<FileBadge className="h-5 w-5" />} />
            <StatTile label="Avg. Score" value={Math.round(
              (resumes.filter(r => typeof r.score === "number").reduce((a, b) => a + (b.score || 0), 0) || 0) /
              Math.max(1, resumes.filter(r => typeof r.score === "number").length)
            )} hint="Across parsed resumes" icon={<BarChart3 className="h-5 w-5" />} />
            <StatTile label="AI Credits" value={`${credits.used}/${credits.limit}`} hint="Used / limit" icon={<Brain className="h-5 w-5" />} />
          </motion.div>
        </motion.section>

        {/* MAIN GRID: RESUME LIST + INSIGHTS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left: resume list (span 2) */}
          <div className="lg:col-span-2 space-y-6">

            {/* toolbar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input placeholder="Search resumes or filenames..." className="pl-10 bg-neutral-900 border-neutral-800" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search resumes"/>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Sort resumes"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 px-3 py-2 rounded text-sm cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="score">Score</option>
                </select>

                <Button variant="ghost" onClick={() => {
                  const first = filtered[0];
                  if (!first) return alert("No resume selected");
                  setSelected({ [first.id]: true });
                }} className="cursor-pointer">Select First</Button>

                <Button onClick={() => analyzeSelected()} variant="outline" className="cursor-pointer">Analyze</Button>
                <Button onClick={() => generateForSelected()} disabled={!anySelected} className="cursor-pointer">Generate</Button>
                <Button variant="destructive" onClick={() => deleteSelected()} disabled={!anySelected} className="cursor-pointer">Delete</Button>
              </div>
            </div>

            {/* list */}
            <motion.div variants={staggerVariants} initial="hidden" animate="show" className="space-y-3">
              {loading ? (
                <div className="grid gap-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rounded-xl p-6 bg-white/3 border border-white/6 animate-pulse h-20" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl p-8 border border-white/6 text-center">
                  <div className="text-neutral-400">No resumes found. Upload your first resume to get started.</div>
                  <div className="mt-4"><Button onClick={() => setUploaderOpen(true)} className="cursor-pointer">Upload Resume</Button></div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((r) => (
                    <ResumeRow key={r.id} r={r} />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>

            {/* pager */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-neutral-500">Showing {filtered.length} resume(s)</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => window.alert("Prev (TODO)")} className="cursor-pointer">Prev</Button>
                <div className="text-sm">1</div>
                <Button variant="ghost" size="sm" onClick={() => window.alert("Next (TODO)")} className="cursor-pointer">Next</Button>
              </div>
            </div>
          </div>

          {/* right: insights & recent activity */}
          <aside className="space-y-6">
            <Card className="rounded-2xl border border-white/6 p-4">
              <CardHeader>
                <CardTitle>Resume Copilot</CardTitle>
                <CardDescription>Interact with the AI assistant for suggestions & rewrites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-neutral-400">Quick suggestions</div>

                  <div className="rounded-md p-3 border border-white/6 bg-black/10 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-white/6 flex items-center justify-center"><Zap className="h-4 w-4" /></div>
                      <div>
                        <div className="font-medium">Make skills scannable</div>
                        <div className="text-xs text-neutral-400">Add a top skills list to increase ATS match.</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md p-3 border border-white/6 bg-black/10 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-white/6 flex items-center justify-center"><AlertTriangle className="h-4 w-4" /></div>
                      <div>
                        <div className="font-medium">Avoid scanned images</div>
                        <div className="text-xs text-neutral-400">Scanned PDFs require OCR and may lose structure.</div>
                      </div>
                    </div>
                  </div>

                  <Button className="bg-white text-black cursor-pointer" onClick={() => window.alert("Open Copilot (TODO)")}>Ask Copilot</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-white/6 p-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions in your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resumes.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/6 flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                        <div>
                          <div className="font-medium">{r.title}</div>
                          <div className="text-xs text-neutral-400">Edited {humanAgo(r.uploadedAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => window.alert(`View ${r.id}`)} className="cursor-pointer">View</Button>
                        <Button size="sm" onClick={() => analyzeSelected()} className="cursor-pointer">Analyze</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-white/6 p-4">
              <CardHeader>
                <CardTitle>Recent Insights</CardTitle>
                <CardDescription>Snapshots from the AI engine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div>“Your resume matches ~82% of current market demand.”</div>
                  <div>“Common keywords: React, Node.js, Next.js, MongoDB”</div>
                  <div>“Suggested improvement: quantify impact with numbers.”</div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>

        {/* FOOTER */}
        <footer className="mt-12 border-t border-white/6 pt-6 text-sm text-neutral-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} ParseForge — built by Utkarsh</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.alert("Settings (TODO)")} className="cursor-pointer"><Settings className="h-4 w-4 mr-2" />Settings</Button>
            <Button variant="ghost" onClick={() => window.alert("Activity (TODO)")} className="cursor-pointer"><Clock className="h-4 w-4 mr-2" />Activity</Button>
          </div>
        </footer>
      </div>

      {/* UPLOADER MODAL (simple) */}
      <AnimatePresence>
        {uploaderOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.22, ease: easing }} className="max-w-xl w-full bg-black rounded-2xl border border-white/6 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Upload Resume</h3>
                  <p className="text-sm text-neutral-400 mt-1">Drop a PDF or DOCX file to get started.</p>
                </div>
                <div>
                  <Button variant="ghost" onClick={() => setUploaderOpen(false)} className="cursor-pointer">Close</Button>
                </div>
              </div>

              <div className="mt-6">
                <label className="block p-6 rounded-lg border border-dashed border-white/6 text-center cursor-pointer">
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleUploadFile(file ?? undefined);
                  }} />
                  <div className="flex flex-col items-center gap-3">
                    <FileUp className="h-8 w-8" />
                    <div className="text-sm">Click to choose a file or drag it here</div>
                    <div className="text-xs text-neutral-500">Supported: PDF, DOCX, TXT</div>
                  </div>
                </label>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ===========================================================================
   END OF FILE
   =========================================================================== */

