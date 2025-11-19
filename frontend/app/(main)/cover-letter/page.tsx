"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Clipboard,
  Download,
  Edit3,
  Loader2,
  FileText,
  Sparkles,
  ChevronDown,
  Trash2,
  Plus,
  Search as SearchIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * Apple-grade, black & white, cover-letter generator page (~400+ lines)
 *
 * - Single file using shadcn/ui primitives (Button, Card, Select, Tooltip, Dialog, Popover, Slider)
 * - Icon-only action bar with tooltips (Edit / Regenerate / Copy / Download)
 * - History, localStorage persistence, keyboard shortcuts
 * - Microinteractions & accessible tooltips
 * - Polished layout, responsive, cursor pointer everywhere
 *
 * Paste into a page file and wire shadcn components as required.
 */

/* ---------------------------- Types & Utilities ---------------------------- */

type StyleOption = "Professional" | "Friendly" | "Confident" | "Modern";
type ToneOption = "Formal" | "Casual" | "Balanced";
type LengthOption = "Short" | "Medium" | "Detailed";

type Settings = {
  style: StyleOption;
  tone: ToneOption;
  length: LengthOption;
  personalization: number; // 0..10
};

type GeneratedLetter = {
  id: string;
  title: string;
  jdSnippet: string;
  text: string;
  createdAt: string;
  settings: Settings;
};

const uid = (prefix = "") => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function friendlyTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function clamp(n: number, a = 0, b = 10) {
  return Math.max(a, Math.min(b, n));
}

/* ----------------------------- Tiny Toast Hook ----------------------------- */

function useToasts() {
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const push = (text: string) => {
    const id = uid("t-");
    setToasts((s) => [...s, { id, text }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4200);
  };
  return { toasts, push };
}

/* ----------------------- Mock AI Generation (replaceable) ------------------ */

/**
 * A deterministic, embellished mock generator that produces
 * plausible-sounding cover letters from a job description + settings.
 *
 * Replace this with your proper LLM / API call as needed.
 */
async function generateCoverLetterMock(jd: string, settings: Settings): Promise<string> {
  // emulate latency and streaming-esque behavior
  await new Promise((res) => setTimeout(res, 700 + Math.random() * 800));

  const tokens = jd
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 10)
    .map((w) => w.toLowerCase());

  const opening =
    settings.tone === "Casual"
      ? "Hi there,"
      : settings.tone === "Formal"
      ? "Dear Hiring Manager,"
      : "Dear Team,";

  const styleHook =
    settings.style === "Confident"
      ? "I'm excited to bring measurable impact and bold improvements."
      : settings.style === "Friendly"
      ? "I'd love to join your team and collaborate closely."
      : settings.style === "Modern"
      ? "I focus on modern practices and rapid iteration."
      : "I offer reliable experience and a pragmatic approach.";

  const keywords = tokens.length ? tokens.join(", ") + "." : "the skills listed.";

  const body =
    tokens.length > 0
      ? `In prior roles, I worked on ${tokens.slice(0, Math.max(1, Math.round(tokens.length * (settings.length === "Short" ? 0.5 : settings.length === "Medium" ? 1 : 1.4)))).join(
          ", "
        )}. I have shipped improvements to performance, reliability, and developer experience.`
      : "I have shipped improvements to performance, reliability, and developer experience.";

  const personalization = settings.personalization >= 7 ? " I was particularly drawn to your mission and product direction; I have ideas I'd love to discuss." : "";

  const closing = settings.tone === "Formal" ? "Sincerely," : "Best regards,";

  const additional =
    settings.length === "Detailed"
      ? "\n\nI enjoy mentoring engineers, designing resilient systems, and collaborating across product and design to deliver polished results."
      : "";

  const final =
    `${opening}\n\nI am writing to express my interest in the role described. ${styleHook} My experience aligns with the requirements, including: ${keywords}\n\n${body}${personalization}${additional}\n\n${closing}\n[Your Name]`;

  return final;
}

/* ----------------------------- Icon + Tooltip ----------------------------- */

/**
 * Icon-only button used in action bar.
 * Uses shadcn Tooltip primitives to provide accessible tooltips.
 */
function IconAction({
  children,
  label,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={ariaLabel ?? label}
          onClick={(e) => {
            if (disabled) return;
            onClick?.();
          }}
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded border border-white/10 bg-black text-white hover:bg-white/5 transition cursor-pointer",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-black border border-white/10 text-white text-xs rounded px-2 py-1">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/* ----------------------------- Main Component ----------------------------- */

export default function CoverLetterAppleish() {
  const { toasts, push } = useToasts();

  // inputs
  const [jobDesc, setJobDesc] = useState<string>("");
  const [style, setStyle] = useState<StyleOption>("Professional");
  const [tone, setTone] = useState<ToneOption>("Balanced");
  const [length, setLength] = useState<LengthOption>("Medium");
  const [personalization, setPersonalization] = useState<number>(6);

  // results & UI
  const [output, setOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [searchQ, setSearchQ] = useState<string>("");

  // history
  const [history, setHistory] = useState<GeneratedLetter[]>(() => {
    try {
      const raw = localStorage.getItem("cl_history_v2");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const outputRef = useRef<HTMLTextAreaElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("cl_history_v2", JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  /* keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus history/search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Cmd/Ctrl + G => generate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        handleGenerate();
        return;
      }

      // / => focus job desc
      if (e.key === "/") {
        e.preventDefault();
        const el = document.getElementById("jd-input") as HTMLTextAreaElement | null;
        el?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDesc, style, tone, length, personalization]);

  const settings = useMemo<Settings>(
    () => ({ style, tone, length, personalization: clamp(personalization, 0, 10) }),
    [style, tone, length, personalization]
  );

  const canGenerate = jobDesc.trim().length > 20;

  /* Generate */
  async function handleGenerate(opts?: { saveToHistory?: boolean }) {
    if (!canGenerate) {
      push("Please paste a longer job description (20+ chars).");
      return;
    }

    setIsLoading(true);
    setIsEditing(false);

    try {
      const text = await generateCoverLetterMock(jobDesc, settings);
      setOutput(text);
      setExpanded(true);

      if (opts?.saveToHistory ?? true) {
        const item: GeneratedLetter = {
          id: uid("cl-"),
          title: `${settings.style} • ${settings.tone} • ${settings.length}`,
          jdSnippet: jobDesc.slice(0, 160).replace(/\s+/g, " ") + (jobDesc.length > 160 ? "…" : ""),
          text,
          createdAt: new Date().toISOString(),
          settings,
        };
        setHistory((h) => [item, ...h].slice(0, 40));
      }

      push("Cover letter generated.");
      setTimeout(() => outputRef.current?.focus(), 80);
    } catch (err) {
      console.error(err);
      push("Generation failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!canGenerate) {
      push("Please paste a job description (20+ chars).");
      return;
    }
    setIsLoading(true);
    setIsEditing(false);
    try {
      const text = await generateCoverLetterMock(jobDesc, settings);
      setOutput(text);
      setExpanded(true);
      push("Regenerated.");
    } catch {
      push("Regeneration failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!output) {
      push("Nothing to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      push("Copied to clipboard.");
    } catch {
      push("Copy failed.");
    }
  }

  function handleDownload() {
    if (!output) {
      push("Nothing to download.");
      return;
    }
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    push("Downloaded .txt");
  }

  function handleSaveEdit() {
    setIsEditing(false);
    push("Saved edits.");
  }

  function handleLoadHistory(item: GeneratedLetter) {
    setOutput(item.text);
    setStyle(item.settings.style);
    setTone(item.settings.tone);
    setLength(item.settings.length);
    setPersonalization(item.settings.personalization);
    setExpanded(true);
    push("Loaded historical letter.");
    setTimeout(() => outputRef.current?.focus(), 50);
  }

  function handleDeleteHistory(id: string) {
    setHistory((h) => h.filter((x) => x.id !== id));
    push("Deleted from history.");
  }

  const filteredHistory = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return history;
    return history.filter((h) => h.title.toLowerCase().includes(q) || h.jdSnippet.toLowerCase().includes(q));
  }, [history, searchQ]);

  /* small UI helpers for polish */
  const subtleCard = "bg-black border border-white/6 rounded-2xl";

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-[1200px] mx-auto space-y-6 select-none">

        {/* header */}
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
              <FileText className="h-6 w-6 text-neutral-300" />
              Cover Letter — Atelier
            </h1>
            <p className="text-neutral-400 mt-1 max-w-xl">
              Paste a job description, tune the voice, and generate a tailored cover letter with refined, minimal controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setJobDesc("");
                setOutput("");
                setExpanded(false);
                push("Cleared.");
              }}
              className="cursor-pointer"
            >
              Clear
            </Button>

            <Button
              onClick={() => handleGenerate({ saveToHistory: true })}
              disabled={!canGenerate || isLoading}
              className="bg-black border border-white/10 text-white hover:bg-white/5 cursor-pointer"
            >
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate
            </Button>
          </div>
        </div>

        {/* content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* left column - controls & JD */}
          <div className="lg:col-span-2 space-y-6">

            <Card className={subtleCard}>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    id="jd-input"
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Paste job description here (responsibilities, requirements, company description)..."
                    className="w-full min-h-[220px] p-4 rounded-xl resize-vertical bg-black border border-white/10 text-white focus:outline-none focus:ring-0 cursor-text"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-neutral-300 select-none">Style</label>
                      <Select onValueChange={(v) => setStyle(v as StyleOption)}>
                        <SelectTrigger className="w-[180px] bg-black text-white border border-white/10 cursor-pointer">
                          <SelectValue placeholder={style} />
                          <ChevronDown className="ml-2 h-4 w-4 text-neutral-400" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border border-white/10 text-white">
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Friendly">Friendly</SelectItem>
                          <SelectItem value="Confident">Confident</SelectItem>
                          <SelectItem value="Modern">Modern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-neutral-300 select-none">Tone</label>
                      <Select onValueChange={(v) => setTone(v as ToneOption)}>
                        <SelectTrigger className="w-[160px] bg-black text-white border border-white/10 cursor-pointer">
                          <SelectValue placeholder={tone} />
                        </SelectTrigger>
                        <SelectContent className="bg-black border border-white/10 text-white">
                          <SelectItem value="Formal">Formal</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Balanced">Balanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-neutral-300 select-none">Length</label>
                      <Select onValueChange={(v) => setLength(v as LengthOption)}>
                        <SelectTrigger className="w-[140px] bg-black text-white border border-white/10 cursor-pointer">
                          <SelectValue placeholder={length} />
                        </SelectTrigger>
                        <SelectContent className="bg-black border border-white/10 text-white">
                          <SelectItem value="Short">Short</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <label className="text-sm text-neutral-300 select-none">Personalization</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={personalization}
                          onChange={(e) => setPersonalization(Number(e.target.value))}
                          className="h-2 w-36 accent-white cursor-pointer"
                        />
                        <div className="text-xs text-neutral-400 w-8 text-right">{personalization}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick presets / prompts area */}
            <Card className={subtleCard}>
              <CardHeader>
                <CardTitle>Quick Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStyle("Professional");
                      setTone("Balanced");
                      setLength("Medium");
                      setPersonalization(6);
                      push("Preset: Balanced Professional");
                    }}
                    className="cursor-pointer"
                  >
                    Balanced
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setStyle("Confident");
                      setTone("Formal");
                      setLength("Detailed");
                      setPersonalization(8);
                      push("Preset: Senior / Confident");
                    }}
                    className="cursor-pointer"
                  >
                    Senior
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setStyle("Friendly");
                      setTone("Casual");
                      setLength("Short");
                      setPersonalization(4);
                      push("Preset: Friendly / Short");
                    }}
                    className="cursor-pointer"
                  >
                    Friendly
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="border border-white/10 cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Custom Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a custom preset</DialogTitle>
                      </DialogHeader>
                      <div className="mt-2">
                        <p className="text-sm text-neutral-400">This is a placeholder dialog for custom presets. Implement saving presets to localStorage or backend as desired.</p>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => push("Custom presets not implemented in mock.")}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* right column - output & history */}
          <div className="space-y-6">

            <Card className={subtleCard}>
              <CardHeader>
                <CardTitle>Generated Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    {!output && !isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-neutral-500 text-center">
                          <p className="font-medium">Results will appear here</p>
                          <p className="text-xs mt-1">Click Generate to create a personalized cover letter</p>
                        </div>
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {isLoading && (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="min-h-[160px] flex items-center justify-center">
                            <Loader2 className="animate-spin h-8 w-8 text-neutral-400" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                      {expanded && !isLoading && (
                        <motion.div
                          key="output-block"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          {isEditing ? (
                            <textarea
                              ref={outputRef}
                              value={output}
                              onChange={(e) => setOutput(e.target.value)}
                              className="w-full min-h-[160px] p-4 rounded-xl resize-vertical bg-black border border-white/10 text-white focus:outline-none"
                            />
                          ) : (
                            <div className="w-full min-h-[160px] p-4 rounded-xl bg-black border border-white/10 text-white whitespace-pre-wrap break-words">
                              {output ? <pre className="whitespace-pre-wrap">{output}</pre> : <div className="text-neutral-500">No output yet.</div>}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Icon action bar */}
                  <div className="flex items-center gap-3">
                    <IconAction
                      label={isEditing ? "Save edits" : "Edit"}
                      onClick={() => {
                        if (isEditing) handleSaveEdit();
                        else {
                          if (!output) return push("Nothing to edit.");
                          setIsEditing(true);
                          setTimeout(() => outputRef.current?.focus(), 40);
                        }
                      }}
                      ariaLabel="edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </IconAction>

                    <IconAction
                      label="Regenerate"
                      onClick={handleRegenerate}
                      ariaLabel="regenerate"
                      disabled={!output || isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </IconAction>

                    <IconAction label="Copy" onClick={handleCopy} ariaLabel="copy" disabled={!output}>
                      <Clipboard className="h-4 w-4" />
                    </IconAction>

                    <IconAction label="Download" onClick={handleDownload} ariaLabel="download" disabled={!output}>
                      <Download className="h-4 w-4" />
                    </IconAction>

                    <div className="ml-auto text-xs text-neutral-400">{output ? `Last: ${friendlyTime(history[0]?.createdAt)}` : ""}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* history panel */}
            <Card className={subtleCard}>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent>
                {/* SEARCH + SORT + ACTIONS */}
<div className="flex items-center gap-2 mb-3">

  {/* SEARCH INPUT WITH ICON (shadcn compatible) */}
  <div className="relative w-full max-w-xs">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
    <Input
      value={searchQ}
      onChange={(e) => setSearchQ(e.target.value)}
      placeholder="Search history..."
      ref={searchRef}
      className="bg-black border border-white/10 text-white pl-10 cursor-text"
    />
  </div>

  {/* SORT BUTTON */}
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        className="border border-white/10 cursor-pointer hover:bg-white/5"
      >
        Sort
      </Button>
    </PopoverTrigger>

    <PopoverContent className="bg-black border border-white/10 p-2 w-36">
      <div className="flex flex-col gap-1">

        <button
          className="text-left px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
          onClick={() =>
            setHistory((h) =>
              [...h].sort(
                (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
              )
            )
          }
        >
          Newest
        </button>

        <button
          className="text-left px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
          onClick={() =>
            setHistory((h) =>
              [...h].sort(
                (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
              )
            )
          }
        >
          Oldest
        </button>

        <button
          className="text-left px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
          onClick={() =>
            setHistory((h) => [...h].sort((a, b) => a.title.localeCompare(b.title)))
          }
        >
          Title
        </button>

      </div>
    </PopoverContent>
  </Popover>

  {/* RIGHT SIDE ACTIONS */}
  <div className="ml-auto flex items-center gap-2">

    {/* CLEAR HISTORY */}
    <Button
      variant="ghost"
      onClick={() => {
        setHistory([]);
        push("Cleared history.");
      }}
      className="cursor-pointer hover:bg-white/5"
    >
      <Trash2 className="h-4 w-4" />
    </Button>

    {/* EXPORT BUTTON */}
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="cursor-pointer hover:bg-white/5">
          Export
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-black border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Export history</DialogTitle>
        </DialogHeader>

        <p className="mt-2 text-sm text-neutral-400">
          This will download your history as a JSON file.
        </p>

        <div className="mt-4 flex justify-end">
          <Button
            className="cursor-pointer hover:bg-white/10"
            onClick={() => {
              const blob = new Blob([JSON.stringify(history, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cover-letter-history-${new Date()
                .toISOString()
                .slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              push("Exported history.");
            }}
          >
            Download JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</div>

                {filteredHistory.length === 0 ? (
                  <div className="text-neutral-500">No generated letters yet.</div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[320px] overflow-auto pr-2">
                    {filteredHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 bg-black border border-white/5 rounded-lg flex items-start gap-3 hover:bg-white/5 cursor-pointer"
                        onClick={() => handleLoadHistory(h)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">{h.title}</div>
                            <div className="text-xs text-neutral-500">• {friendlyTime(h.createdAt)}</div>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1 truncate">{h.jdSnippet}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(h.text).then(() => push("Copied from history."));
                              }}
                              className="px-2 py-1 border border-white/10 rounded cursor-pointer hover:bg-white/5 text-xs"
                            >
                              Copy
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadHistory(h);
                              }}
                              className="px-2 py-1 border border-white/10 rounded cursor-pointer hover:bg-white/5 text-xs"
                            >
                              Open
                            </button>
                          </div>

                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHistory(h.id);
                              }}
                              className="px-2 py-1 border border-white/10 rounded cursor-pointer hover:bg-white/5 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* toasts */}
      <div className="fixed right-6 bottom-6 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div key={t.id} className="p-3 rounded-md bg-black border border-white/10 text-sm">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
