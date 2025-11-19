import {
  Home,
  FileText,
  BarChart2,
  Search,
  Settings,
  User,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Briefcase,
  ClipboardList,
  MessageSquare,
  FileCode,
  Sparkles,
  Lock,
  Crown,
} from "lucide-react";

export const navSections = [
  {
    title: "WORKSPACE",
    links: [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/resumes", icon: FileUp, label: "Resumes" },
      { href: "/history", icon: FileText, label: "History" },
      { href: "/analytics", icon: BarChart2, label: "ATS Score" },
    ],
  },
  {
    title: "AI TOOLS",
    links: [
      { href: "/analyze-jd", icon: Briefcase, label: "Analyze JD" },
      {
        href: "/cover-letter",
        icon: ClipboardList,
        label: "Cover Letter",
        tag: "PRO",
      },
      { href: "/summary", icon: FileCode, label: "Summary", tag: "BETA" },
      {
        href: "/ai-insights",
        icon: Sparkles,
        label: "AI Insights",
        tag: "PRO",
      },
      { href: "/suggestions", icon: MessageSquare, label: "Suggestions" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { href: "/help", icon: HelpCircle, label: "Help & Docs" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];
