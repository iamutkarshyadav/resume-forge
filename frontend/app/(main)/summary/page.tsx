"use client";

import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Edit3,
  History,
  X,
  FileText,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SummaryPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const summaryRef = useRef<HTMLTextAreaElement | null>(null);

  // ---------- LOAD HISTORY FROM LOCAL STORAGE ----------
  useEffect(() => {
    const stored = localStorage.getItem("parseforge-summary-history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  // ---------- SAVE HISTORY ----------
  const pushHistory = (entry: any) => {
    const updated = [entry, ...history];
    setHistory(updated);
    localStorage.setItem("parseforge-summary-history", JSON.stringify(updated));
  };

  // ---------- FILE UPLOAD ----------
  const handleFileUpload = async (file: File) => {
    setResumeFile(file);

    const text = await file.text(); // mock parsing
    setResumeText(text);
  };

  // ---------- GENERATE SUMMARY ----------
  const generateSummary = async () => {
    if (!resumeText.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const output = `Here is a polished professional summary based on your resume:
      
A results-driven software engineer with strong experience in frontend and backend development, specializing in React, Node.js, and AI integrations. Demonstrated expertise in designing scalable systems, optimizing UI/UX, and crafting maintainable code. Proven track record of delivering impactful products, collaborating across teams, and adapting quickly to new technologies.`;
      setSummary(output);

      pushHistory({
        id: Date.now(),
        createdAt: new Date().toISOString(),
        resumeText,
        summary: output,
      });

      setIsGenerating(false);
    }, 1200);
  };

  // ---------- REFINE SUMMARY ----------
  const refineSummary = async () => {
    if (!summary.trim() || !enhancePrompt.trim()) return;
    setIsRefining(true);

    setTimeout(() => {
      const better = summary + `\n\nRefinement applied: ${enhancePrompt}`;
      setSummary(better);
      setIsRefining(false);
      setEnhancePrompt("");
    }, 900);
  };

  // ---------- COPY SUMMARY ----------
  const copySummary = () => {
    navigator.clipboard.writeText(summary);
  };

  // ---------- DOWNLOAD ----------
  const downloadSummary = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-black text-white p-10">

      {/* HEADER */}
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">Professional Summary Generator</h1>
        <p className="text-neutral-500 mt-2 text-sm max-w-2xl">
          Upload your resume or paste your content. Let AI craft a clean, polished, job-ready professional summary.
        </p>
      </header>

      <div className="grid grid-cols-12 gap-10">

        {/* LEFT PANEL — RESUME INPUT */}
        <div className="col-span-12 lg:col-span-6 space-y-8">

          {/* Upload Box */}
          <div className="border border-white/10 rounded-md p-6">

            <p className="text-sm mb-3 font-medium">Upload Resume</p>

            <div
              className="border border-dashed border-white/20 rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition"
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-neutral-500 mb-3" />
              <p className="text-sm text-neutral-400">
                Click to upload PDF, DOCX, or TXT
              </p>
              {resumeFile && (
                <p className="text-xs mt-2 text-neutral-500">{resumeFile.name}</p>
              )}
            </div>

            <Input
              type="file"
              ref={fileRef}
              className="hidden"
              onChange={(e) => {
                const fileList = e.target.files;
                if (!fileList || !fileList.length) return;
                handleFileUpload(fileList[0]);
              }}
            />
          </div>

          {/* Paste resume */}
          <div className="border border-white/10 rounded-md p-6">
            <p className="text-sm mb-3 font-medium">Paste Resume Text</p>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={12}
              placeholder="Paste your resume text here..."
              className="bg-black border-white/10 text-sm"
            />
          </div>

          <div>
            <Button
              className="w-full bg-white text-black rounded-md hover:bg-neutral-200 cursor-pointer"
              onClick={generateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Summary"}
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL — SUMMARY OUTPUT */}
        <div className="col-span-12 lg:col-span-6 space-y-8">

          {/* Summary Output */}
          <div className="border border-white/10 rounded-md p-6 min-h-[400px] relative">

            <div className="flex items-center justify-between mb-4">

              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Generated Summary
              </div>

              {/* action icons */}
              <div className="flex items-center gap-3">

                {/* regenerate */}
                <Tooltip text="Regenerate">
                  <button
                    className="p-2 rounded-md hover:bg-white/5 cursor-pointer"
                    onClick={generateSummary}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </Tooltip>

                {/* copy */}
                <Tooltip text="Copy">
                  <button
                    className="p-2 rounded-md hover:bg-white/5 cursor-pointer"
                    onClick={copySummary}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </Tooltip>

                {/* download */}
                <Tooltip text="Download">
                  <button
                    className="p-2 rounded-md hover:bg-white/5 cursor-pointer"
                    onClick={downloadSummary}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </Tooltip>

              </div>
            </div>

            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              ref={summaryRef}
              rows={16}
              placeholder="Your AI-generated summary will appear here..."
              className="bg-black text-sm border-none focus-visible:ring-0"
            />

          </div>

          {/* Enhancement */}
          <div className="border border-white/10 rounded-md p-6">

            <p className="text-sm mb-3 font-medium">Improve Summary</p>

            <Textarea
              value={enhancePrompt}
              onChange={(e) => setEnhancePrompt(e.target.value)}
              rows={4}
              placeholder="Add instructions to refine or rewrite the summary..."
              className="bg-black border-white/10 text-sm"
            />

            <Button
              className="mt-3 bg-neutral-900 border border-white/10 hover:bg-neutral-800 cursor-pointer"
              onClick={refineSummary}
              disabled={isRefining}
            >
              {isRefining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Enhance Summary
                </div>
              )}
            </Button>
          </div>

          {/* HISTORY */}
          <div className="border border-white/10 rounded-md p-6">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <History className="h-4 w-4" />
                Summary History
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="cursor-pointer hover:bg-white/5">
                    View All
                  </Button>
                </DialogTrigger>

                <DialogContent className="bg-black border border-white/10 max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Generated Summaries</DialogTitle>
                  </DialogHeader>

                  <ScrollArea className="h-96 pr-4 mt-3">
                    <div className="space-y-6">
                      {history.map((entry) => (
                        <div
                          key={entry.id}
                          className="border border-white/10 rounded-md p-4 hover:bg-white/5 transition"
                        >
                          <p className="text-xs text-neutral-500 mb-2">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                          <p className="whitespace-pre-wrap text-sm">
                            {entry.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            {/* Preview of history */}
            {history.slice(0, 2).map((entry) => (
              <div
                key={entry.id}
                className="p-3 border border-white/10 rounded-md text-xs text-neutral-400 mb-3 hover:bg-white/5 transition cursor-pointer"
              >
                {entry.summary.slice(0, 150)}...
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ----------- Tooltip Component (Apple Minimal) ------------ */
function Tooltip({ text, children }: { text: string; children: any }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
        {text}
      </div>
    </div>
  );
}
