"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Plus,
  Search,
  Briefcase,
  Trash2,
  Edit2,
  Tag,
  Calendar,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type JobDescription = {
  id: string;
  title: string;
  company?: string;
  fullText: string;
  tags: string[];
  keySkills: string[];
  createdAt: string;
};

export default function JobDescriptionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [jdToDelete, setJdToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    fullText: "",
    tags: "",
  });

  const { data: jds, isLoading, refetch } = trpc.jobDescription.list.useQuery({
    tag: selectedTag,
  });

  const createMutation = trpc.jobDescription.save.useMutation({
    onSuccess: () => {
      toast.success("Job description saved!");
      setFormData({ title: "", company: "", fullText: "", tags: "" });
      setShowNewDialog(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save JD");
    },
  });

  const deleteMutation = trpc.jobDescription.delete.useMutation({
    onSuccess: () => {
      toast.success("Job description deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  const handleCreate = () => {
    if (!formData.title || !formData.fullText) {
      toast.error("Title and job description text are required");
      return;
    }

    createMutation.mutate({
      title: formData.title,
      company: formData.company || undefined,
      fullText: formData.fullText,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    });
  };

  const handleDeleteClick = (id: string) => {
    setJdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (jdToDelete) {
      deleteMutation.mutate({ jdId: jdToDelete });
      setDeleteConfirmOpen(false);
      setJdToDelete(null);
    }
  };

  const handleAnalyzeWithJD = (jd: JobDescription) => {
    router.push(`/analyze?jdId=${jd.id}`);
  };

  const allTags = Array.from(
    new Set((jds || []).flatMap((jd) => jd.tags))
  );

  const filtered = (jds || []).filter((jd) =>
    jd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jd.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3">
              <Briefcase className="h-8 w-8" />
              Job Library
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Save job descriptions to analyze your resume against multiple roles
            </p>
          </div>

          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-neutral-200 rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Job Description
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 border border-neutral-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Save Job Description</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Job Title *
                  </label>
                  <Input
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="bg-neutral-900 border-neutral-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Company (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Google, Microsoft"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="bg-neutral-900 border-neutral-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Tags (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g. Frontend, Senior, React, NYC"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="bg-neutral-900 border-neutral-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Job Description *
                  </label>
                  <textarea
                    placeholder="Paste the full job description here..."
                    value={formData.fullText}
                    onChange={(e) =>
                      setFormData({ ...formData, fullText: e.target.value })
                    }
                    className="w-full h-40 bg-neutral-900 border border-neutral-800 rounded-lg text-white p-3 resize-none focus:outline-none focus:border-neutral-700"
                  />
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full bg-white text-black hover:bg-neutral-200"
                >
                  {createMutation.isPending ? "Saving..." : "Save Job Description"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.header>

        {/* SEARCH & FILTERS */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search by title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-neutral-900 border-neutral-800 text-white"
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedTag === null ? "default" : "outline"}
                onClick={() => setSelectedTag(null)}
                className="rounded-full"
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  size="sm"
                  variant={selectedTag === tag ? "default" : "outline"}
                  onClick={() => setSelectedTag(tag)}
                  className="rounded-full"
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        {/* JOB LISTINGS */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-3"
        >
          {isLoading ? (
            <div className="text-center py-12 text-neutral-400">
              Loading job descriptions...
            </div>
          ) : filtered.length === 0 ? (
            <Card className="bg-neutral-950 border border-neutral-800">
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-neutral-600 mx-auto mb-4 opacity-50" />
                <p className="text-neutral-400">No job descriptions yet</p>
                <p className="text-sm text-neutral-500 mt-2">
                  Create one to start comparing your resume
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((jd: JobDescription) => (
              <motion.div
                key={jd.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold group-hover:text-white transition-colors">
                          {jd.title}
                        </h3>
                        {jd.company && (
                          <p className="text-sm text-neutral-400 mt-1">
                            {jd.company}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          {jd.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-neutral-800 text-neutral-300"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {jd.keySkills.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-neutral-500 mb-2">
                              Key Skills:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {jd.keySkills.slice(0, 5).map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="border-neutral-700 text-neutral-400 text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {jd.keySkills.length > 5 && (
                                <Badge
                                  variant="outline"
                                  className="border-neutral-700 text-neutral-400 text-xs"
                                >
                                  +{jd.keySkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-neutral-500 mt-3 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(jd.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-neutral-400 hover:text-white"
                          onClick={() => handleAnalyzeWithJD(jd)}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Analyze
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteClick(jd.id)}
                          disabled={deleteMutation.isPending}
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
      </div>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Job Description?"
        description="This action cannot be undone. The job description will be permanently deleted."
        actionLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setJdToDelete(null);
        }}
      />
    </main>
  );
}
