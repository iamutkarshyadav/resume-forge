"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, Download, Trash2, BarChart2, ChevronDown, Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { downloadAsJSON, getDownloadFilename } from "@/lib/download";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";

type Resume = {
  id: string;
  filename: string;
  createdAt: string;
  jsonData?: any;
};

type Match = {
  id: string;
  score?: number;
  summary?: string;
  createdAt: string;
};

export default function ResumeDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const resumeId = pathname?.split("/").pop() ?? "";
  const { success: successNotify, error: errorNotify } = useNotifications();

  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const resumeQuery = trpc.resume.get.useQuery(
    { resumeId },
    { enabled: !!resumeId }
  );
  const deleteFileMutation = trpc.file.deleteFile.useMutation();

  const resume = resumeQuery.data as Resume | undefined;
  const jsonData = resume?.jsonData || {};

  const pastAnalysesQuery = trpc.activity.getRecentMatches.useQuery(
    { limit: 10, resumeId },
    { enabled: !!resumeId }
  );

  const pastAnalyses = pastAnalysesQuery.data || [];

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

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteFileMutation.mutateAsync({ fileId: resumeId });
      toast.success("Resume deleted successfully");
      router.push("/resumes");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete resume");
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!resume) return;

    setDownloading(true);
    try {
      const filename = getDownloadFilename(
        resume.filename.replace(/\.[^.]+$/, ""),
        ".json"
      );
      downloadAsJSON(resume.jsonData || {}, filename);
      successNotify("Resume downloaded successfully");
    } catch (err) {
      console.error("Download error:", err);
      errorNotify("Failed to download resume");
    } finally {
      setDownloading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  if (resumeQuery.isLoading) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
            <p className="text-neutral-400 mt-4">Loading resume...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!resume) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <p className="text-neutral-400">Resume not found</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-semibold">{resume.filename}</h1>
            </div>
            <p className="text-sm text-neutral-500 ml-12">
              Uploaded {new Date(resume.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-neutral-700"
              onClick={handleDownload}
              disabled={downloading || !resume}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </Button>
            <Button
              variant="ghost"
              className="text-red-400 hover:text-red-500"
              onClick={handleDeleteClick}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* PARSED DATA SECTION */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-4"
        >
          {/* Contact Info */}
          {(jsonData.name || jsonData.email || jsonData.phone) && (
            <Card className="bg-neutral-950 border border-neutral-800 rounded-xl">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {jsonData.name && (
                    <div>
                      <p className="text-xs text-neutral-400">Name</p>
                      <p className="text-sm font-medium">{jsonData.name}</p>
                    </div>
                  )}
                  {jsonData.email && (
                    <div>
                      <p className="text-xs text-neutral-400">Email</p>
                      <p className="text-sm font-medium text-blue-400">
                        {jsonData.email}
                      </p>
                    </div>
                  )}
                  {jsonData.phone && (
                    <div>
                      <p className="text-xs text-neutral-400">Phone</p>
                      <p className="text-sm font-medium">{jsonData.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {jsonData.summary && (
            <Card className="bg-neutral-950 border border-neutral-800 rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Summary</h3>
                <p className="text-sm text-neutral-300">
                  {jsonData.summary.substring(0, 300)}
                  {jsonData.summary.length > 300 ? "..." : ""}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills (Collapsible) */}
          {jsonData.skills && jsonData.skills.length > 0 && (
            <Card className="bg-neutral-950 border border-neutral-800 rounded-xl">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors">
                    <h3 className="text-sm font-semibold">
                      Skills ({jsonData.skills.length})
                    </h3>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-neutral-800 p-4">
                  <div className="flex flex-wrap gap-2">
                    {jsonData.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-full bg-neutral-800 text-neutral-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Experience (Collapsible) */}
          {jsonData.experience && jsonData.experience.length > 0 && (
            <Card className="bg-neutral-950 border border-neutral-800 rounded-xl">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors">
                    <h3 className="text-sm font-semibold">
                      Experience ({jsonData.experience.length})
                    </h3>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-neutral-800 p-4 space-y-3">
                  {jsonData.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium">
                        {exp.title || exp.company || "Position"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {exp.company && `${exp.company} •`} {exp.start}{" "}
                        {exp.end && `– ${exp.end}`}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-neutral-400 mt-1">
                          {exp.description.substring(0, 150)}
                          {exp.description.length > 150 ? "..." : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Education (Collapsible) */}
          {jsonData.education && jsonData.education.length > 0 && (
            <Card className="bg-neutral-950 border border-neutral-800 rounded-xl">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors">
                    <h3 className="text-sm font-semibold">
                      Education ({jsonData.education.length})
                    </h3>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-neutral-800 p-4 space-y-3">
                  {jsonData.education.map((edu: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium">{edu.institution}</p>
                      <p className="text-xs text-neutral-500">
                        {edu.degree} {edu.start && `• ${edu.start}`}{" "}
                        {edu.end && `– ${edu.end}`}
                      </p>
                      {edu.gpa && (
                        <p className="text-xs text-neutral-400 mt-1">
                          GPA: {edu.gpa}
                        </p>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </motion.section>

        {/* PAST ANALYSES SECTION */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Card className="bg-neutral-950 border border-neutral-800 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Past Analyses</CardTitle>
            </CardHeader>
            {pastAnalyses.length === 0 ? (
              <CardContent className="text-center py-8">
                <BarChart2 className="h-8 w-8 text-neutral-600 mx-auto mb-3 opacity-50" />
                <p className="text-neutral-400 text-sm">
                  No analyses yet. Analyze this resume against job descriptions to see results here.
                </p>
              </CardContent>
            ) : (
              <CardContent className="space-y-3">
                {pastAnalyses.map((match) => (
                  <div
                    key={match.id}
                    className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart2 className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium">
                          {match.summary}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {timeAgo(match.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{match.score}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </motion.section>

        {/* PRIMARY CTA */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex gap-3"
        >
          <Button
            onClick={() => router.push("/analyze")}
            className="bg-white text-black hover:bg-neutral-200 rounded-lg"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Analyze Again
          </Button>
          <Button
            variant="outline"
            className="border-neutral-700"
            onClick={() => router.push("/resumes")}
          >
            Back to Library
          </Button>
        </motion.div>
      </div>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Resume?"
        description="This action cannot be undone. The resume will be permanently deleted."
        actionLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        isPending={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </main>
  );
}
