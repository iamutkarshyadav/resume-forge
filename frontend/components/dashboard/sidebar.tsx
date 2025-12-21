"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Lock,
  Crown,
  Home,
  Zap,
  Clock,
  FileText,
  Briefcase,
  GitBranch,
  TrendingUp,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "../ui/skeleton";

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MAIN_NAV: NavSection[] = [
  {
    title: "Primary",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Analyze", href: "/analyze", icon: Zap },
      { label: "History", href: "/history", icon: Clock },
    ],
  },
  {
    title: "Library",
    items: [
      { label: "Resumes", href: "/resumes", icon: FileText },
      { label: "Jobs", href: "/job-descriptions", icon: Briefcase },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Versions", href: "/versions", icon: GitBranch },
      { label: "Progress", href: "/progress", icon: TrendingUp },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: user, isLoading } = trpc.user.getProfile.useQuery();

  return (
    <aside
      className={`flex flex-col h-screen border-r border-neutral-800 bg-black text-white transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold tracking-tight select-none">
            Resume Forge
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-neutral-900 text-neutral-400 cursor-pointer ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Search (only when expanded) */}
      {!isCollapsed && (
        <div className="p-3 border-b border-neutral-800">
          <div className="flex items-center bg-neutral-900 rounded-lg px-3 gap-2">
            <Search className="h-4 w-4 text-neutral-500 flex-shrink-0" />
            <Input
              placeholder="Search..."
              className="bg-transparent border-none text-sm placeholder:text-neutral-500 focus-visible:ring-0 text-white cursor-text py-2"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col py-4 select-none">
          {MAIN_NAV.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {!isCollapsed && (
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3 px-4">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="cursor-pointer block group"
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start font-medium transition-all text-sm hover:bg-neutral-900 text-neutral-300 rounded-lg cursor-pointer ${
                          isCollapsed
                            ? "flex justify-center p-3 h-12"
                            : "px-4 py-2 h-auto"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon
                          className={`flex-shrink-0 ${
                            isCollapsed ? "h-6 w-6" : "h-5 w-5 mr-3"
                          }`}
                        />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {sectionIdx < MAIN_NAV.length - 1 && (
                <Separator className={`my-4 ${isCollapsed ? "mx-2" : ""} bg-neutral-800`} />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-neutral-800">
        {!isCollapsed && (
          <div className="bg-white text-black rounded-lg p-3 shadow-sm mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Free Plan</h2>
              <Crown className="h-4 w-4 text-yellow-600" />
            </div>

            <Slider
              defaultValue={[40]}
              max={100}
              step={1}
              className="mt-2 cursor-pointer"
            />

            <p className="text-xs text-neutral-600 mt-2">4 / 10 analyses</p>

            <Button
              variant="default"
              className="w-full mt-3 bg-black text-white hover:bg-neutral-800 cursor-pointer flex items-center justify-center gap-2 rounded-lg"
            >
              <Crown className="h-4 w-4 text-yellow-400" />
              Upgrade
            </Button>
          </div>
        )}

        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-700 transition-colors">
              <User className="h-4 w-4 text-neutral-400" />
            </div>
            {!isCollapsed && (
              <div>
                {isLoading ? (
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-32" />
                  </div>
                ) : user ? (
                  <>
                    <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </>
                ) : null}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Link href="/settings">
              <Lock className="h-4 w-4 text-neutral-500 hover:text-white transition-colors cursor-pointer" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
