"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Upload, PlusCircle, Brain, BarChart3, Clock, ChevronRight, Linkedin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Chart.js imports
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Resume = {
  id: string;
  title: string;
  uploadedAt: string;
  score?: number;
  insight?: string;
  status: "Analyzed" | "Pending";
};

export default function ResumeLibraryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState({ name: "Utkarsh", avatar: "/placeholder.svg" });
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date" | "score" | "status">("date");

  useEffect(() => {
    const demoResumes: Resume[] = [
      { id: "1", title: "Senior Software Engineer.pdf", uploadedAt: "2025-11-18", score: 92, insight: "Strong backend keywords; add distributed-systems terms.", status: "Analyzed" },
      { id: "2", title: "Frontend Developer.pdf", uploadedAt: "2025-11-17", score: 85, insight: "Consider listing React + performance optimizations.", status: "Analyzed" },
      { id: "3", title: "DevOps Resume.pdf", uploadedAt: "2025-11-15", score: 76, insight: "Missing CI/CD tools list (CircleCI/GitHub Actions).", status: "Pending" },
    ];
    setRecentResumes(demoResumes);
  }, []);

  // ✅ BACKEND INTEGRATION — DO NOT TOUCH UI
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

      const res = await fetch("http://localhost:3000/api/v1/files/upload", {
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

      const data = await res.json();

      // 🔥 Extract resume ID for redirect — works for ANY backend shape
      const resumeId =
        data?.data?.resumeId ||
        data?.data?.id ||
        data?.resumeId ||
        data?.id ||
        null;

      if (!resumeId) {
        throw new Error("Upload succeeded but no resume ID returned.");
      }

      // Add to UI
      const newResume: Resume = {
        id: resumeId,
        title: file.name,
        uploadedAt: new Date().toISOString(),
        status: "Pending",
      };

      setRecentResumes((prev) => [newResume, ...prev]);

      // Redirect to analysis page
      router.push(`/resumes/${resumeId}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onChooseFile = () => fileInputRef.current?.click();

  const filteredResumes = recentResumes
    .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "score") return (b.score ?? 0) - (a.score ?? 0);
      if (sort === "status") return a.status.localeCompare(b.status);
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

  const chartData = {
    labels: recentResumes.map((r) => r.title),
    datasets: [
      {
        label: "Resume Score",
        data: recentResumes.map((r) => r.score ?? 0),
        borderColor: "#ffffff",
        backgroundColor: "rgba(255,255,255,0.2)",
      },
    ],
  };

  const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
  const containerStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-12">
      {/* HEADER */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Resume Workspace</h1>
            <p className="text-neutral-400 mt-1">Upload, track and analyze resumes with AI-powered insights.</p>
          </div>
          <Avatar className="h-10 w-10 border border-neutral-700">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>

        <div className="relative w-full md:w-1/3 mb-8">
          <Input
            placeholder="Search resumes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 w-full bg-neutral-900 border-neutral-800 text-neutral-100"
          />
          <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
        </div>
      </motion.div>

      {/* UPLOAD + RECENT RESUMES */}
      <motion.section variants={containerStagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Card */}
        <Card className="border border-neutral-800 bg-neutral-950 rounded-2xl p-8">
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>Drag & drop, browse files, or choose an option below.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <motion.label
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              htmlFor="resume-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 rounded-xl py-16 cursor-pointer hover:border-neutral-500 transition"
            >
              <Upload className="h-10 w-10 mb-4" />
              <span className="text-lg font-medium">Drag & drop your resume</span>
              <p className="text-sm text-neutral-400 mt-2">or click to browse</p>

              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </motion.label>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="outline" className="flex items-center justify-center gap-2" onClick={onChooseFile}>
                <PlusCircle className="h-4 w-4" /> Upload File
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2">
                <Linkedin className="h-4 w-4" /> Import from LinkedIn
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" /> Scan PDF
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2">
                <Brain className="h-4 w-4" /> Start New Resume
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Resumes */}
        <Card className="border border-neutral-800 bg-neutral-950 rounded-2xl p-6 space-y-6">
          <CardHeader>
            <CardTitle>Recent Resumes</CardTitle>
            <CardDescription>Quick access to uploaded files and insights</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {filteredResumes.length === 0 && <p className="text-neutral-400">No resumes found.</p>}

            {filteredResumes.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-between items-center p-3 rounded-lg hover:bg-neutral-900/20 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-neutral-400">
                      {r.uploadedAt} • {r.status}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/resumes/${r.id}`)}>View</Button>
                  <Button variant="default" size="sm" onClick={() => router.push(`/resumes/${r.id}`)}>Analyze</Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.section>

      {/* Graph Analytics */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        
        <Card className="border border-neutral-800 bg-neutral-950 p-6 rounded-2xl">
          <CardTitle>Resume Score Trends</CardTitle>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "#fff" } },
                tooltip: { enabled: true },
              },
              scales: {
                x: { ticks: { color: "#fff" } },
                y: { ticks: { color: "#fff" } },
              },
            }}
          />
        </Card>

        <Card className="border border-neutral-800 bg-neutral-950 p-6 rounded-2xl space-y-4">
          <CardTitle>AI Suggestions</CardTitle>

          {recentResumes.map((r, i) => (
            <div
              key={i}
              className="border border-neutral-700 p-3 rounded-lg hover:bg-neutral-900/30 transition"
            >
              <p className="text-sm text-neutral-400">{r.title}</p>
              <p className="font-medium">{r.insight ?? "No insight yet"}</p>
            </div>
          ))}
        </Card>
      </motion.section>

      <Separator className="bg-neutral-800" />

      {/* Footer */}
      <motion.footer
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row justify-between text-sm text-neutral-400 pt-4 gap-4"
      >
        <p>© 2025 ResumeAI. Built by Utkarsh.</p>

        <div className="flex gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/settings")}>Settings</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/activity")}>Activity</Button>
          <Button variant="ghost" size="sm">Help</Button>
          <Button variant="ghost" size="sm">Feedback</Button>
        </div>
      </motion.footer>
    </div>
  );
}
