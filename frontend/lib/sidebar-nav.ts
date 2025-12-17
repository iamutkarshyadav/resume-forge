import {
  Home,
  FileText,
  Zap,
  BarChart2,
  Clock,
  Settings,
  Briefcase,
  GitBranch,
  TrendingUp,
} from "lucide-react";

export const navSections = [
  {
    title: "MY WORK",
    links: [
      { href: "/dashboard", icon: Home, label: "Dashboard" },
      { href: "/resumes", icon: FileText, label: "Resume Library" },
      { href: "/versions", icon: GitBranch, label: "Version History" },
      { href: "/progress", icon: TrendingUp, label: "Progress" },
    ],
  },
  {
    title: "IMPROVE",
    links: [
      { href: "/analyze", icon: BarChart2, label: "Analyze for Job" },
      { href: "/job-descriptions", icon: Briefcase, label: "Job Library" },
    ],
  },
  {
    title: "HISTORY",
    links: [
      { href: "/history", icon: Clock, label: "Past Analyses" },
    ],
  },
  {
    title: "ACCOUNT",
    links: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];
