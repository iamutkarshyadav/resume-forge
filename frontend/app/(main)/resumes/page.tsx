"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Search, Trash2, Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Resume = {
  id: string;
  filename: string;
  createdAt: string;
};

export default function ResumeLibraryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);

  const resumeQuery = trpc.resume.list.useQuery();
  const deleteFileMutation = trpc.file.deleteFile.useMutation();

  const resumes = resumeQuery.data || [];

  const filteredResumes = resumes.filter((r: Resume) =>
    r.filename.toLowerCase().includes(query.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Login expired. Please sign in again.");
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
      const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || "v1";
      const uploadUrl = `${apiBaseUrl}/api/${apiVersion}/files/upload`;

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        let message = "Upload failed.";
        try {
          const err = await res.json();
          message = err?.message || message;
        } catch {}
        throw new Error(message);
      }

      // Refetch resumes list
      await resumeQuery.refetch();

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (fileId: string) => {
    setResumeToDelete(fileId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;

    setDeleting(resumeToDelete);
    try {
      await deleteFileMutation.mutateAsync({ fileId: resumeToDelete });
      await resumeQuery.refetch();
      toast.success("Resume deleted successfully");
      setDeleteConfirmOpen(false);
      setResumeToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete resume");
    } finally {
      setDeleting(null);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.header initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="text-4xl font-semibold tracking-tight">My Resumes</h1>
          <p className="text-neutral-500 mt-2">
            {resumes.length} resume{resumes.length !== 1 ? "s" : ""} uploaded
          </p>
        </motion.header>

        {/* UPLOAD SECTION */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Upload a Resume</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    PDF, DOCX, or TXT files accepted
                  </p>
                </div>

                <motion.label
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  htmlFor="resume-upload"
                  className="cursor-pointer"
                >
                  <Button
                    className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </motion.label>
              </div>

              {uploading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-700 text-sm text-red-300">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* SEARCH */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative"
        >
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search resumes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 rounded-lg"
          />
        </motion.div>

        {/* RESUMES LIST */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp}>
          {filteredResumes.length === 0 ? (
            <Card className="bg-neutral-950 border border-neutral-800 rounded-2xl">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-400">
                  {resumes.length === 0
                    ? "No resumes yet. Upload one to get started."
                    : "No resumes match your search."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredResumes.map((resume: Resume, idx: number) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors rounded-lg">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {resume.filename}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-400 hover:text-white"
                          onClick={() => router.push(`/resumes/${resume.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                          onClick={() => router.push("/analyze")}
                        >
                          Analyze
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-500 hover:text-red-400"
                          onClick={() => handleDeleteClick(resume.id)}
                          disabled={deleting === resume.id}
                        >
                          {deleting === resume.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Resume?"
        description="This action cannot be undone. The resume will be permanently deleted."
        actionLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        isPending={!!deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setResumeToDelete(null);
        }}
      />
    </main>
  );
}
