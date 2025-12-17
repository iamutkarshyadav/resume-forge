"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Minus } from "lucide-react";

interface ResumeDiffViewerProps {
  originalText: string;
  improvedText: string;
  originalScore: number;
  improvedScore: number;
}

// Escape special regex characters to prevent regex injection
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function ResumeDiffViewer({
  originalText,
  improvedText,
  originalScore,
  improvedScore,
}: ResumeDiffViewerProps) {
  const [highlightMode, setHighlightMode] = useState<"all" | "added" | "removed">("all");

  const originalWords = new Set(originalText.toLowerCase().match(/\b\w+\b/g) || []);
  const improvedWords = new Set(improvedText.toLowerCase().match(/\b\w+\b/g) || []);

  const addedWords = Array.from(improvedWords).filter(w => !originalWords.has(w));
  const removedWords = Array.from(originalWords).filter(w => !improvedWords.has(w));
  const scoreDelta = improvedScore - originalScore;

  const highlightText = (text: string, type: "original" | "improved"): string => {
    // First escape HTML to prevent XSS
    let result = escapeHtml(text);

    if (type === "original" && highlightMode === "removed") {
      if (removedWords.length > 0) {
        const pattern = removedWords.map(escapeRegex).join("|");
        const regex = new RegExp(`\\b(${pattern})\\b`, "gi");
        result = result.replace(regex, '<mark class="removed-highlight">$1</mark>');
      }
      return result;
    }

    if (type === "improved" && highlightMode === "added") {
      if (addedWords.length > 0) {
        const pattern = addedWords.map(escapeRegex).join("|");
        const regex = new RegExp(`\\b(${pattern})\\b`, "gi");
        result = result.replace(regex, '<mark class="added-highlight">$1</mark>');
      }
      return result;
    }

    if (highlightMode === "all") {
      if (type === "improved" && addedWords.length > 0) {
        const pattern = addedWords.map(escapeRegex).join("|");
        const addRegex = new RegExp(`\\b(${pattern})\\b`, "gi");
        result = result.replace(addRegex, '<mark class="added-highlight">$1</mark>');
      }
      if (type === "original" && removedWords.length > 0) {
        const pattern = removedWords.map(escapeRegex).join("|");
        const remRegex = new RegExp(`\\b(${pattern})\\b`, "gi");
        result = result.replace(remRegex, '<mark class="removed-highlight">$1</mark>');
      }
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <style>{`
        .added-highlight {
          background-color: rgba(34, 197, 94, 0.2);
          font-weight: bold;
        }
        .removed-highlight {
          background-color: rgba(239, 68, 68, 0.2);
          text-decoration: line-through;
        }
      `}</style>
      {/* Score Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card className="bg-neutral-950 border border-neutral-800">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-400 mb-1">Before</p>
            <p className="text-3xl font-bold text-neutral-300">{originalScore}%</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border border-neutral-800 flex items-center justify-center">
          <CardContent className="p-4 text-center">
            <ArrowRight className="h-6 w-6 text-neutral-500" />
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border border-neutral-800 relative overflow-hidden">
          <div className={`absolute inset-0 ${scoreDelta > 0 ? "bg-green-900/10" : scoreDelta < 0 ? "bg-red-900/10" : ""}`} />
          <CardContent className="p-4 text-center relative">
            <p className="text-sm text-neutral-400 mb-1">After</p>
            <p className={`text-3xl font-bold ${scoreDelta > 0 ? "text-green-400" : scoreDelta < 0 ? "text-red-400" : "text-neutral-300"}`}>
              {improvedScore}%
            </p>
            {scoreDelta !== 0 && (
              <p className={`text-xs mt-2 ${scoreDelta > 0 ? "text-green-400" : "text-red-400"}`}>
                {scoreDelta > 0 ? "+" : ""}{scoreDelta}%
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Highlight Mode Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-400">Show:</span>
        <div className="flex gap-2">
          {["all", "added", "removed"].map((mode) => (
            <button
              key={mode}
              onClick={() => setHighlightMode(mode as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                highlightMode === mode
                  ? mode === "added"
                    ? "bg-green-900/30 text-green-400 border border-green-700/50"
                    : mode === "removed"
                    ? "bg-red-900/30 text-red-400 border border-red-700/50"
                    : "bg-neutral-700 text-white"
                  : "bg-neutral-900 text-neutral-400 border border-neutral-800"
              }`}
            >
              {mode === "all" && "All Changes"}
              {mode === "added" && (
                <>
                  <Plus className="h-3 w-3 mr-1 inline" />
                  Added
                </>
              )}
              {mode === "removed" && (
                <>
                  <Minus className="h-3 w-3 mr-1 inline" />
                  Removed
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Text Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-950 border border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Original</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words max-h-96 overflow-y-auto prose prose-invert"
              dangerouslySetInnerHTML={{
                __html: highlightText(originalText.substring(0, 500), "original"),
              }}
            />
            {originalText.length > 500 && (
              <p className="text-xs text-neutral-500 mt-2">... (truncated)</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Improved</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words max-h-96 overflow-y-auto prose prose-invert"
              dangerouslySetInnerHTML={{
                __html: highlightText(improvedText.substring(0, 500), "improved"),
              }}
            />
            {improvedText.length > 500 && (
              <p className="text-xs text-neutral-500 mt-2">... (truncated)</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card className="bg-neutral-950 border border-neutral-800">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-green-400 font-medium mb-1">Keywords Added</p>
            <p className="text-2xl font-bold text-white">{addedWords.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border border-neutral-800">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-red-400 font-medium mb-1">Keywords Removed</p>
            <p className="text-2xl font-bold text-white">{removedWords.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 border border-neutral-800">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-neutral-400 font-medium mb-1">Score Impact</p>
            <p className={`text-2xl font-bold ${scoreDelta > 0 ? "text-green-400" : scoreDelta < 0 ? "text-red-400" : "text-neutral-300"}`}>
              {scoreDelta > 0 ? "+" : ""}{scoreDelta}%
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
