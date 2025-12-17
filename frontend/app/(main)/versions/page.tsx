"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResumeDiffViewer } from "@/components/ResumeDiffViewer";
import {
  GitBranch,
  Download,
  Trash2,
  ArrowRight,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Version = {
  id: string;
  versionNumber: number;
  title?: string;
  sourceType: string;
  scoreAtCreation?: number;
  fullText: string;
  createdAt: string;
};

export default function VersionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId");
  const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null]);
  const [showDiff, setShowDiff] = useState(false);

  const { data: versions, isLoading, refetch } = trpc.resumeVersion.listVersions.useQuery(
    { resumeId: resumeId || "" },
    { enabled: !!resumeId }
  );

  const { data: version1 } = trpc.resumeVersion.getVersion.useQuery(
    { versionId: selectedVersions[0] || "" },
    { enabled: !!selectedVersions[0] }
  );

  const { data: version2 } = trpc.resumeVersion.getVersion.useQuery(
    { versionId: selectedVersions[1] || "" },
    { enabled: !!selectedVersions[1] }
  );

  const restoreMutation = trpc.resumeVersion.restoreVersion.useMutation({
    onSuccess: () => {
      toast.success("Version restored!");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to restore version");
    },
  });

  const deleteMutation = trpc.resumeVersion.deleteVersion.useMutation({
    onSuccess: () => {
      toast.success("Version deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete version");
    },
  });

  const handleRestore = (versionId: string) => {
    if (!resumeId) return;
    if (confirm("This will create a new version from this restore point.")) {
      restoreMutation.mutate({ resumeId, fromVersionId: versionId });
    }
  };

  const handleDelete = (versionId: string) => {
    if (confirm("Are you sure? This cannot be undone.")) {
      deleteMutation.mutate({ versionId });
    }
  };

  if (!resumeId) {
    return (
      <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <Card className="bg-neutral-950 border border-neutral-800 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <GitBranch className="h-12 w-12 text-neutral-600 mx-auto mb-4 opacity-50" />
            <p className="text-neutral-400">Select a resume to view its versions</p>
            <Button
              onClick={() => router.push("/resumes")}
              className="mt-4 bg-white text-black hover:bg-neutral-200"
            >
              Go to Resume Library
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3">
              <GitBranch className="h-8 w-8" />
              Version History
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Track improvements and compare resume versions
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/resumes")}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-900"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Back
          </Button>
        </motion.header>

        {/* VERSIONS LIST */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-4"
        >
          {isLoading ? (
            <div className="text-center py-12 text-neutral-400">
              Loading versions...
            </div>
          ) : !versions || versions.length === 0 ? (
            <Card className="bg-neutral-950 border border-neutral-800">
              <CardContent className="p-12 text-center">
                <GitBranch className="h-12 w-12 text-neutral-600 mx-auto mb-4 opacity-50" />
                <p className="text-neutral-400">No versions found</p>
              </CardContent>
            </Card>
          ) : (
            versions.map((version: Version, idx: number) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={`bg-neutral-950 border transition-all cursor-pointer ${
                    selectedVersions.includes(version.id)
                      ? "border-white"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="secondary"
                            className="bg-neutral-800 text-neutral-300"
                          >
                            v{version.versionNumber}
                          </Badge>
                          <span className="text-sm font-medium capitalize text-neutral-400">
                            {version.sourceType === "ai_generated"
                              ? "AI Generated"
                              : version.sourceType === "manual_edit"
                              ? "Manual Edit"
                              : "Uploaded"}
                          </span>
                        </div>

                        {version.title && (
                          <p className="text-base font-semibold">{version.title}</p>
                        )}

                        <p className="text-sm text-neutral-500 mt-2">
                          {new Date(version.createdAt).toLocaleDateString()} •{" "}
                          {new Date(version.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {version.scoreAtCreation !== null &&
                          version.scoreAtCreation !== undefined && (
                            <div className="mt-3">
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-900 rounded-lg">
                                <span className="text-sm text-neutral-400">Score:</span>
                                <span className="text-lg font-bold text-white">
                                  {version.scoreAtCreation}%
                                </span>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant={selectedVersions[0] === version.id ? "default" : "outline"}
                          onClick={() =>
                            setSelectedVersions([
                              selectedVersions[0] === version.id ? null : version.id,
                              selectedVersions[1],
                            ])
                          }
                          className="rounded-lg"
                        >
                          {selectedVersions[0] === version.id ? "Deselect" : "Select"}
                        </Button>

                        {selectedVersions[0] && selectedVersions[0] !== version.id && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedVersions([selectedVersions[0], version.id]);
                              setShowDiff(true);
                            }}
                            className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoreMutation.isPending}
                          className="text-neutral-400 hover:text-white"
                          title="Create a new version from this one"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(version.id)}
                          disabled={deleteMutation.isPending || versions.length <= 1}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* DIFF VIEWER */}
        {showDiff && version1 && version2 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Version Comparison</h2>
              <Button
                variant="ghost"
                onClick={() => setShowDiff(false)}
                className="text-neutral-400 hover:text-white"
              >
                Close
              </Button>
            </div>

            <Card className="bg-neutral-950 border border-neutral-800">
              <CardContent className="p-8">
                <ResumeDiffViewer
                  originalText={version1.fullText}
                  improvedText={version2.fullText}
                  originalScore={version1.scoreAtCreation || 0}
                  improvedScore={version2.scoreAtCreation || 0}
                />
              </CardContent>
            </Card>
          </motion.section>
        )}
      </div>
    </main>
  );
}
