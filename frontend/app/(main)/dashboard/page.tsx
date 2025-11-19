"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileUp,
  FileText,
  PlusCircle,
  Brain,
  BarChart3,
  Search,
  Sparkles,
  Settings,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardHome() {
  const [greeting, setGreeting] = useState("");
  const user = { name: "Utkarsh", avatar: "/placeholder.svg" };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const containerStagger = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent)] pointer-events-none" />

      {/* Header */}
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {greeting}, <span className="text-neutral-400">{user.name}</span>
          </h1>
          <p className="text-neutral-500 mt-2 text-lg">
            Your workspace, perfectly optimized.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto mt-6 md:mt-0">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search anything..."
              className="pl-10 w-full md:w-[300px] bg-neutral-900 border-neutral-800 text-neutral-100"
            />
          </div>
          <Avatar className="h-10 w-10 border border-neutral-700">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </motion.header>

      {/* Quick Actions */}
      <motion.section
        variants={containerStagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
      >
        {[
          {
            title: "Upload Resume",
            desc: "Upload and parse your resume instantly.",
            icon: FileUp,
            action: "Upload File",
          },
          {
            title: "Create New",
            desc: "Start from scratch or use templates.",
            icon: PlusCircle,
            action: "Start New",
          },
          {
            title: "AI Analysis",
            desc: "Instant feedback powered by AI.",
            icon: Brain,
            action: "Analyze",
          },
          {
            title: "Analytics",
            desc: "Track performance and keywords.",
            icon: BarChart3,
            action: "View Reports",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="group relative overflow-hidden border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition-all rounded-2xl"
          >
            <CardContent className="p-6">
              <div
                className={cn(
                  "absolute top-4 right-4 h-10 w-10 rounded-lg flex items-center justify-center bg-neutral-800 group-hover:bg-neutral-700 transition-colors"
                )}
              >
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-sm text-neutral-400 mb-6">{item.desc}</p>
              <Button
                variant="outline"
                className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 rounded-xl"
              >
                {item.action}
              </Button>
            </CardContent>
          </motion.div>
        ))}
      </motion.section>

      {/* AI Assistant */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden border border-neutral-800 rounded-3xl bg-neutral-950 backdrop-blur-xl mb-20"
      >
        <div className="p-10 flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">
              Resume Copilot
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Interact with your AI assistant for insights, feedback, and
              tailored improvements on your resume.
            </p>
            <Button className="rounded-xl bg-white text-black hover:bg-neutral-200 mt-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Ask Copilot
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mt-10 md:mt-0"
          >
            <div className="absolute -top-8 -right-8 w-48 h-48 bg-neutral-800 rounded-full blur-3xl opacity-20" />
            <div className="relative border border-neutral-800 rounded-2xl bg-black p-8 shadow-inner">
              <p className="text-neutral-400 text-sm">
                “Your resume matches 82% of current market demand.”
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-neutral-300" />
                <span className="text-neutral-300 text-sm">
                  AI Insight Active
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition p-4"
            >
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-100">
                    Resume_{i}.pdf
                  </p>
                  <p className="text-sm text-neutral-500">Edited {i}h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-lg"
                >
                  View
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-neutral-200 rounded-lg"
                >
                  Analyze
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-neutral-800 text-sm text-neutral-500 flex items-center justify-between">
        <p>© 2025 ResumeAI. Built by Utkarsh.</p>
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white"
          >
            <Clock className="h-4 w-4 mr-2" />
            Activity
          </Button>
        </div>
      </footer>
    </div>
  );
}
