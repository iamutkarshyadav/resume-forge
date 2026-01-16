"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Code, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ExportResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeContent: string;
  fileName: string;
  score?: number;
}

type ExportFormat = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
  note?: string;
  atsScore?: number;
  disabled?: boolean;
};

export function ExportResumeDialog({
  open,
  onOpenChange,
  resumeContent,
  fileName,
  score,
}: ExportResumeDialogProps) {
  const [exporting, setExporting] = useState(false);

  const formats: ExportFormat[] = [
    {
      id: "pdf",
      label: "PDF",
      description: "Formatted PDF document",
      icon: <FileText className="h-5 w-5" />,
      recommended: true,
      atsScore: 85,
      note: "ATS Friendly (85%)",
    },
    {
      id: "docx",
      label: "DOCX",
      description: "Microsoft Word format",
      icon: <FileText className="h-5 w-5" />,
      atsScore: 90,
      note: "Coming Soon",
      disabled: true,
    },
    {
      id: "ats-plain",
      label: "ATS-Optimized",
      description: "Plain text, ATS system optimized",
      icon: <Code className="h-5 w-4" />,
      atsScore: 95,
      note: "Coming Soon",
      disabled: true,
    },
    {
      id: "recruiter-friendly",
      label: "Recruiter-Friendly",
      description: "Formatted for human review",
      icon: <FileText className="h-5 w-5" />,
      note: "Coming Soon",
      disabled: true,
    },
  ];

  const handleExport = (format: string) => {
    setExporting(true);
    setTimeout(() => {
      // Simulate export
      const element = document.createElement("a");
      const file = new Blob([resumeContent], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${fileName.replace(/\.[^/.]+$/, "")}_${format}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success(`Exported as ${format.toUpperCase()}`);
      setExporting(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border border-neutral-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Resume</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {score && score < 70 && (
            <div className="flex gap-3 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">
                  Warning: Low Score
                </p>
                <p className="text-xs text-yellow-200/80 mt-1">
                  Your resume score is below 70%. We recommend making improvements
                  before exporting. Generate an improved version to boost your score.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formats.map((format) => (
              <Card
                key={format.id}
                className={`bg-neutral-900 border border-neutral-800 transition-colors ${
                  format.disabled 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:border-neutral-700 cursor-pointer"
                }`}
                onClick={() => !format.disabled && handleExport(format.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-neutral-400">{format.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{format.label}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {format.description}
                      </p>
                    </div>
                    {format.recommended && !format.disabled && (
                      <Badge className="bg-green-900 text-green-300 text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>

                  {format.note && (
                    <div className="text-xs text-neutral-400 mt-2 p-2 bg-neutral-800/50 rounded">
                      {format.note}
                    </div>
                  )}

                  <Button
                    disabled={exporting || format.disabled}
                    className="w-full mt-3 bg-white text-black hover:bg-neutral-200 text-sm rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!format.disabled) handleExport(format.id);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    {format.disabled ? "Coming Soon" : "Download"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-neutral-900 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-neutral-300">📋 Export Recommendations:</p>
            <ul className="text-xs text-neutral-400 space-y-1 ml-4 list-disc">
              <li>Use <strong>ATS-Optimized</strong> for online applications</li>
              <li>Use <strong>PDF</strong> for recruiters and emails</li>
              <li>Use <strong>DOCX</strong> to allow recruiters to edit</li>
              <li>Use <strong>Recruiter-Friendly</strong> when applying directly</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
