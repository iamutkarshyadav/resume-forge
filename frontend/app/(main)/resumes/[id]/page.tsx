"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import {
  FileText,
  BarChart3,
  Brain,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Download,
  Share2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { Tab } from "@headlessui/react";
import { Line, Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ------------------ Types ------------------

type ResumeAnalysis = {
  id: string;
  title: string;
  uploadedAt: string;
  score: number;
  status: "Analyzed" | "Pending";
  insights: string[];
  jobMatchScore?: number;
  timeline: { step: string; time: string; completed: boolean }[];
  metrics: { label: string; value: number }[];
  keywords: { label: string; value: number }[];
};

// ------------------ Component ------------------

export default function ResumeAnalysisPage() {
  const router = useRouter();
  const pathname = usePathname();

  const resumeId = pathname.split("/")[2] || "unknown";

  const [resume, setResume] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Simulate API call
  useEffect(() => {
    setTimeout(() => {
      setResume({
        id: resumeId,
        title: "Senior Software Engineer.pdf",
        uploadedAt: "2025-11-18",
        score: 88,
        status: "Analyzed",
        insights: [
          "Strong backend keywords; add distributed-systems terms.",
          "Consider listing CI/CD tools explicitly.",
          "Include more quantitative achievements in projects.",
          "Optimize skills section with modern JS frameworks.",
          "Highlight leadership roles in projects.",
          "Add relevant certifications to boost credibility.",
        ],
        jobMatchScore: 82,
        timeline: [
          {
            step: "Uploaded Resume",
            time: "2025-11-18 10:45",
            completed: true,
          },
          {
            step: "Initial AI Scan",
            time: "2025-11-18 10:47",
            completed: true,
          },
          {
            step: "Keyword Optimization",
            time: "2025-11-18 10:50",
            completed: true,
          },
          {
            step: "Final Report Generated",
            time: "2025-11-18 10:52",
            completed: true,
          },
        ],
        metrics: [
          { label: "Experience", value: 90 },
          { label: "Skills", value: 85 },
          { label: "Projects", value: 70 },
          { label: "Education", value: 60 },
        ],
        keywords: [
          { label: "Backend", value: 80 },
          { label: "Frontend", value: 65 },
          { label: "DevOps", value: 50 },
          { label: "React", value: 70 },
          { label: "NodeJS", value: 60 },
        ],
      });

      setLoading(false);
    }, 800);
  }, [resumeId]);

  if (loading || !resume)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading analysis...
      </div>
    );

  // ------------------ Animations ------------------

  const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // ------------------ Charts ------------------

  const scoreChartData = {
    labels: ["Resume Score", "Job Match Score"],
    datasets: [
      {
        label: "Score",
        data: [resume.score, resume.jobMatchScore ?? 0],
        backgroundColor: ["#fff", "rgba(255,255,255,0.6)"],
      },
    ],
  };

  const keywordChartData = {
    labels: resume.keywords.map((k) => k.label),
    datasets: [
      {
        label: "Keyword Density",
        data: resume.keywords.map((k) => k.value),
        borderColor: "#fff",
        backgroundColor: "rgba(255,255,255,0.2)",
      },
    ],
  };

  const metricChartData = {
    labels: resume.metrics.map((m) => m.label),
    datasets: [
      {
        label: "Coverage",
        data: resume.metrics.map((m) => m.value),
        backgroundColor: "rgba(255,255,255,0.5)",
      },
    ],
  };

  // ------------------ JSX ------------------

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-12">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">{resume.title}</h1>
            <p className="text-neutral-400 mt-1">
              Uploaded at: {resume.uploadedAt}
            </p>
            <p className="text-neutral-500 mt-1">Status: {resume.status}</p>
          </div>

          <Avatar className="h-10 w-10 border border-neutral-700">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </motion.div>
    </div>
  );
}
