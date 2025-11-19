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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navSections } from "@/lib/sidebar-nav";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "../ui/skeleton";

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: user, isLoading } = trpc.user.getProfile.useQuery();

  return (
    <aside
      className={`flex flex-col h-screen border-r border-neutral-800 bg-black text-white transition-all duration-500 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold tracking-tight select-none">
            ParseForge
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-neutral-900 text-neutral-400 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-neutral-800">
        <div
          className={`flex items-center bg-neutral-900 rounded-md px-2 ${
            isCollapsed ? "justify-center" : "gap-2"
          }`}
        >
          <Search className="h-4 w-4 text-neutral-500" />
          {!isCollapsed && (
            <Input
              placeholder="Search..."
              className="bg-transparent border-none text-sm placeholder:text-neutral-500 focus-visible:ring-0 text-white cursor-text"
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col py-4 select-none">
          {navSections.map((section, index) => (
            <div key={index}>
              <SectionLabel isCollapsed={isCollapsed}>
                {section.title}
              </SectionLabel>
              {section.links.map((link) => (
                <SidebarLink
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  tag={link.tag}
                  isCollapsed={isCollapsed}
                />
              ))}
              {index < navSections.length - 1 && (
                <Separator className="my-4 bg-neutral-800" />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        {!isCollapsed && (
          <div className="bg-white text-black rounded-md p-3 shadow-sm">
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

            <p className="text-xs text-neutral-600 mt-2">4 / 10 AI credits</p>

            <Button
              variant="default"
              className="w-full mt-3 bg-black text-white hover:bg-neutral-800 cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="h-4 w-4 text-yellow-400" />
              Upgrade to Pro
            </Button>
          </div>
        )}
        <div
          className={`flex items-center mt-4 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="h-8 w-8 rounded-md bg-neutral-800 flex items-center justify-center">
              <User className="h-4 w-4 text-neutral-400" />
            </div>
            {!isCollapsed && (
              <div>
                {isLoading ? (
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ) : user ? (
                  <>
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </>
                ) : null}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Lock className="h-4 w-4 text-neutral-500 hover:text-white transition-colors cursor-pointer" />
          )}
        </div>
      </div>
    </aside>
  );
}

/* --- COMPONENTS --- */

function SidebarLink({
  href,
  icon: Icon,
  label,
  tag,
  isCollapsed,
}: {
  href: string;
  icon: any;
  label: string;
  tag?: string;
  isCollapsed: boolean;
}) {
  return (
    <Link href={href} className="cursor-pointer">
      <Button
        variant="ghost"
        className={`w-full justify-start font-medium transition-all text-sm hover:bg-neutral-900 text-neutral-300 rounded-none cursor-pointer ${
          isCollapsed ? "flex justify-center py-3" : "px-4 py-2"
        }`}
      >
        <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
        {!isCollapsed && <span>{label}</span>}
        {tag && !isCollapsed && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 border border-neutral-700 rounded-sm text-neutral-400">
            {tag}
          </span>
        )}
      </Button>
    </Link>
  );
}

function SectionLabel({
  children,
  isCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
}) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 ${
        isCollapsed ? "text-center" : "px-4"
      }`}
    >
      {children}
    </p>
  );
}
