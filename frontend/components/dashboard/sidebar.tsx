"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  User,
  ChevronLeft,
  ChevronRight,
  Crown,
  Home,
  Zap,
  Clock,
  FileText,
  Briefcase,
  GitBranch,
  TrendingUp,
  Settings,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    data: user,
    isLoading,
    isError: isUserError,
  } = trpc.user.getProfile.useQuery();
  const {
    data: creditsData,
    isLoading: creditsLoading,
    isError: isCreditsError,
  } = trpc.billing.getUserCredits.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30s for real-time updates
    retry: 1,
  });

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    // Immediate navigation without prefetch delay
    router.push(href);
  };

  return (
    <aside
      className={`flex flex-col h-screen border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        isCollapsed ? "w-24" : "w-64"
      }`}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold tracking-tight select-none">
            MagnaCV
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-sidebar-accent text-sidebar-foreground/70 cursor-pointer ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col py-4 select-none">
          {MAIN_NAV.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {!isCollapsed && (
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-4">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + "/");

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavigation(e, item.href)}
                      className="block"
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start font-medium text-sm rounded-lg border-l-2 transition-all duration-200 cursor-pointer ${
                          isCollapsed
                            ? "flex justify-center p-3 h-12 border-l-0 rounded-lg"
                            : "px-4 py-2 h-auto mx-2"
                        } ${
                          isActive
                            ? "bg-sidebar-accent border-sidebar-primary text-sidebar-accent-foreground shadow-sm"
                            : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                    </a>
                  );
                })}
              </div>

              {sectionIdx < MAIN_NAV.length - 1 && (
                <Separator
                  className={`my-4 ${isCollapsed ? "mx-2" : "mx-4"}`}
                />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer / User Info */}
      <div className="p-4 border-t">
        {!isCollapsed && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-200 dark:border-yellow-800/50 text-foreground rounded-xl p-4 mb-3 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-yellow-900 dark:text-yellow-400">
                PDF Credits
              </h2>
              <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            </div>

            {creditsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : isCreditsError ? (
              <div className="text-center py-2">
                <p className="text-xs text-red-600/80 mb-2">Unavailable</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/billing")}
                  className="w-full text-xs h-8 border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                >
                  Get Credits
                </Button>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold mb-2 text-yellow-700 dark:text-yellow-400">
                  {creditsData?.credits || 0}
                </p>
                <p className="text-xs text-yellow-800/70 dark:text-yellow-300/70 mb-3">
                  {creditsData && creditsData.credits > 0
                    ? `Download ${creditsData.credits} ${creditsData.credits === 1 ? "resume" : "resumes"}`
                    : "No credits available"}
                </p>

                <Button
                  onClick={() => router.push("/billing")}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white cursor-pointer flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-all hover:shadow-md"
                >
                  <Crown className="h-4 w-4" />
                  Get More Credits
                </Button>
              </>
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-200 dark:border-yellow-800/50 text-foreground rounded-xl p-3 w-14 h-14 flex items-center justify-center shadow-md">
              <div className="text-center">
                {creditsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
                ) : isCreditsError ? (
                  <span className="text-xs font-bold text-red-500 block">
                    !
                  </span>
                ) : (
                  <>
                    <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mx-auto mb-1" />
                    <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 block">
                      {creditsData?.credits || 0}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="h-8 w-8 rounded-lg bg-sidebar-accent border flex items-center justify-center flex-shrink-0 group-hover:bg-sidebar-accent/80 transition-colors">
              <User className="h-4 w-4 text-sidebar-foreground/70" />
            </div>
            {!isCollapsed && (
              <div>
                {isLoading ? (
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-32" />
                  </div>
                ) : isUserError ? (
                  <p className="text-xs text-red-500">Error loading user</p>
                ) : user ? (
                  <>
                    <p className="text-sm font-medium text-sidebar-foreground leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
