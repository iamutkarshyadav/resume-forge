"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";

interface FixItModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: string;
  issueType: "missingSkill" | "weakness";
  onSubmit: (response: string) => Promise<void>;
}

export function FixItModal({ open, onOpenChange, issue, issueType, onSubmit }: FixItModalProps) {
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(response.trim());
      setResponse("");
      onOpenChange(false);
    } catch (error) {
      console.error("Fix it error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestion = () => {
    if (issueType === "missingSkill") {
      return `Do you have experience with ${issue}? Please describe your relevant experience.`;
    }
    return `Tell us about your experience with ${issue}. How can we strengthen this area?`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-white" />
            Fix This Issue
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {getQuestion()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Describe your experience or how you've worked with this skill/technology..."
            className="bg-neutral-900 border-neutral-700 text-white min-h-24"
            disabled={submitting}
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setResponse("");
                onOpenChange(false);
              }}
              disabled={submitting}
              className="border-neutral-700 text-white hover:bg-neutral-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!response.trim() || submitting}
              className="bg-white text-black hover:bg-neutral-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Apply Fix
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
