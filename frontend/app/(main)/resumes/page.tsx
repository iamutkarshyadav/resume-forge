"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resumeQuery = trpc.resume.list.useQuery();
  const deleteFileMutation = trpc.file.deleteFile.useMutation();

  const resumes = resumeQuery.data || [];

  const handleFileUpload = async (file: File) => {
    if (uploading) return;

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

      await resumeQuery.refetch();
      toast.success("Resume uploaded successfully!");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Something went wrong.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validTypes = [".pdf", ".docx", ".doc", ".txt"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        toast.error("Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.");
        return;
      }

      handleFileUpload(file);
    }
  };

  const handleDeleteClick = (fileId: string) => {
    setResumeToDelete(fileId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete || deleting) return;

    setDeleting(resumeToDelete);
    try {
      await deleteFileMutation.mutateAsync({ fileId: resumeToDelete });
      await resumeQuery.refetch();
      toast.success("Resume deleted successfully");
      setDeleteConfirmOpen(false);
      setResumeToDelete(null);
    } catch (err) {
      toast.error("Failed to delete resume");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">My Resumes</h1>
          <p className="text-neutral-500">
            {resumes.length > 0 
              ? `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} uploaded`
              : "Upload your first resume to get started"}
          </p>
        </div>

        {/* PREMIUM MEDIUM UPLOAD CARD - ALWAYS VISIBLE */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
          className={`bg-black border transition-colors cursor-pointer ${
            isDragging ? "border-white" : "border-neutral-800"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className={`h-16 w-16 rounded-full border-2 flex items-center justify-center transition-colors ${
                isDragging ? "border-white bg-neutral-900" : "border-neutral-700"
              }`}>
                <Upload className={`h-8 w-8 ${isDragging ? "text-white" : "text-neutral-400"}`} />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-1">Upload Resume</h2>
                <p className="text-sm text-neutral-400">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  PDF, DOCX, DOC, or TXT files accepted
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileInputChange}
                disabled={uploading}
              />

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded border border-red-700 bg-red-900/10 text-red-300 text-sm max-w-md">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* RESUMES LIST */}
        {resumes.length > 0 && (
          <section className="space-y-4">
            <div className="border-t border-neutral-800 pt-8">
              <h2 className="text-xl font-semibold mb-4">Your Resumes</h2>
              <div className="space-y-2">
            {resumes.map((resume: Resume) => (
              <Card
                key={resume.id}
                className="bg-black border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded border border-neutral-800 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resume.filename}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-white cursor-pointer border border-neutral-800"
                      onClick={() => router.push(`/resumes/${resume.id}`)}
                      disabled={!!deleting}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white text-black hover:bg-neutral-200 cursor-pointer"
                      onClick={() => router.push(`/analyze?resumeId=${resume.id}`)}
                      disabled={!!deleting}
                    >
                      Analyze
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-500 hover:text-red-500 cursor-pointer border border-neutral-800"
                      onClick={() => handleDeleteClick(resume.id)}
                      disabled={deleting === resume.id || !!deleting}
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
            ))}
              </div>
            </div>
          </section>
        )}

        {/* EMPTY STATE - Secondary Upload Zone When No Resumes */}
        {resumes.length === 0 && (
          <Card className="bg-black border border-neutral-800">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="h-10 w-10 text-neutral-600" />
                <p className="text-sm text-neutral-400">
                  No resumes uploaded yet. Use the upload card above to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
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
