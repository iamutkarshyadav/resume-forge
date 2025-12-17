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
    title: "MAIN",
    links: [
      { href: "/dashboard", icon: Home, label: "Dashboard" },
      { href: "/analyze", icon: BarChart2, label: "Analyze Resume" },
      { href: "/history", icon: Clock, label: "Past Analyses" },
    ],
  },
  {
    title: "RESOURCES",
    links: [
      { href: "/resumes", icon: FileText, label: "Resume Library" },
      { href: "/job-descriptions", icon: Briefcase, label: "Job Library" },
      { href: "/versions", icon: GitBranch, label: "Version History" },
      { href: "/progress", icon: TrendingUp, label: "Progress" },
    ],
  },
  {
    title: "ACCOUNT",
    links: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];
