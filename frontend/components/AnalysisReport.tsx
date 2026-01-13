"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  XCircle,
  EyeOff,
  SearchX,
  FileWarning,
  ArrowRight,
  Lock,
  Timer,
  Ghost,
  Siren,
  Ban,
  ScanEye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- TYPES ---
export interface AnalysisData {
  match?: {
    score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    missingSkills?: string[];
    recommendations?: string[];
    completenessScore?: number;
    jdRealismScore?: number;
    hasKeywordStuffing?: boolean;
    jdText?: string;
  };
}

interface AnalysisReportProps {
  data: AnalysisData;
  onGenerateResume: () => void;
  onAnalyzeAnother: () => void;
}

// --- COMPONENTS ---

const GlitchText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -ml-0.5 translate-x-[1px] text-red-500 opacity-70 animate-pulse z-0">{text}</span>
      <span className="absolute top-0 left-0 -ml-0.5 -translate-x-[1px] text-cyan-500 opacity-70 animate-pulse delay-75 z-0">{text}</span>
    </span>
  );
};

const RejectionGauge = ({ probability }: { probability: number }) => (
  <div className="relative w-64 h-32 mx-auto overflow-hidden">
    <div className="absolute bottom-0 w-full h-full bg-neutral-900 rounded-t-full border-[20px] border-neutral-800" />
    <motion.div
      initial={{ rotate: -180 }}
      animate={{ rotate: (probability / 100) * 180 - 180 }}
      transition={{ duration: 1.5, ease: "circOut" }}
      className="absolute bottom-0 left-0 w-full h-full origin-bottom rounded-t-full border-[20px] border-red-600 border-b-0 opacity-80"
      style={{ borderRightColor: "transparent", borderLeftColor: "transparent" }}
    />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white rounded-full z-10 shadow-[0_0_20px_rgba(255,0,0,0.8)]" />
    <motion.div
        initial={{ rotate: -90 }}
        animate={{ rotate: (probability / 100) * 180 - 90 }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className="absolute bottom-0 left-1/2 w-1 h-28 bg-white origin-bottom -translate-x-1/2 z-0"
    />
  </div>
);

export function AnalysisReport({ data, onGenerateResume, onAnalyzeAnother }: AnalysisReportProps) {
  const [pulse, setPulse] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000);
    setTimeout(() => setShowScanner(true), 500);
    return () => clearInterval(interval);
  }, []);

  const match = data.match || {};
  const score = match.score || 0;
  const missingSkills = match.missingSkills || [];
  const weaknesses = match.weaknesses || [];
  
  // High Anxiety Calculations
  const rejectionProb = Math.min(99, Math.round(100 - (score * 0.6))); // Harsher curve
  const invisiblePercent = Math.round(100 - score);
  
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      
      {/* 1. HERO: THE CRISIS */}
      <section className="relative pt-12 pb-24 px-6 max-w-5xl mx-auto text-center border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-red-500/5 blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-950/50 border border-red-500/50 text-red-500 font-mono text-sm font-bold mb-10 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.2)]">
            <Siren className="w-5 h-5" />
            CRITICAL VISIBILITY FAILURE DETECTED
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 uppercase leading-[0.9]">
            <span className="text-white">You are</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              Invisible
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed mb-12">
            Most recruiters will <strong className="text-white">never see your name</strong>. <br />
            Your resume is being filtered out by the algorithm before a human even blinks.
          </p>
        </motion.div>

        {/* REJECTION GAUGE */}
        <div className="relative max-w-md mx-auto mb-12">
            <RejectionGauge probability={rejectionProb} />
            <div className="text-center -mt-6">
                <div className="text-5xl font-black text-red-500 tracking-tighter">{rejectionProb}%</div>
                <div className="text-sm font-bold text-red-400/70 uppercase tracking-widest mt-1">Rejection Probability</div>
            </div>
        </div>
      </section>

      {/* 2. THE GLITCH: ATS SIMULATION */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
         <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: The Reality */}
            <div className="space-y-8">
               <h2 className="text-4xl font-bold uppercase tracking-tight">
                  <span className="text-red-500">System Failure:</span> <br />
                  Why You're GHOSTED
               </h2>
               <p className="text-lg text-neutral-400 leading-relaxed">
                  You spent hours writing it. The ATS spent <strong className="text-white">0.02 seconds</strong> rejecting it.
                  Here is specifically why you are losing interviews to less qualified candidates:
               </p>

               <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-red-950/20 border border-red-900/40 rounded-xl">
                     <Ghost className="w-8 h-8 text-red-500" />
                     <div>
                        <div className="font-bold text-red-200">The "Ghost" Effect</div>
                        <div className="text-sm text-red-400/60">{invisiblePercent}% of your skills are unreadable by older parsers.</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                     <SearchX className="w-8 h-8 text-neutral-500" />
                     <div>
                        <div className="font-bold text-neutral-200">Keyword Void</div>
                        <div className="text-sm text-neutral-500">Missing {missingSkills.length} critical high-frequency search terms.</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                     <Ban className="w-8 h-8 text-neutral-500" />
                     <div>
                        <div className="font-bold text-neutral-200">Format Blocking</div>
                        <div className="text-sm text-neutral-500">Layout decisions are triggering auto-reject flags.</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: The Glitch Visual */}
            <div className="relative">
               <div className="absolute inset-0 bg-red-500/10 blur-[80px]" />
               <Card className="relative bg-black border border-red-900/50 overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                  {/* Scanner Bar */}
                  {showScanner && (
                     <motion.div 
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-red-500 box-shadow-[0_0_20px_#ef4444] z-20"
                     />
                  )}
                  
                  <CardContent className="p-8 font-mono text-xs opacity-50 space-y-4 relative">
                     {/* Overlay Glitch */}
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                     
                     <div className="space-y-2 blur-[1px]">
                        <div className="h-4 w-1/3 bg-neutral-800 rounded animate-pulse" />
                        <div className="h-3 w-full bg-neutral-900 rounded" />
                        <div className="h-3 w-full bg-neutral-900 rounded" />
                     </div>
                     
                     <div className="p-4 border border-red-500/40 bg-red-950/10 rounded my-4">
                        <div className="flex items-center gap-2 text-red-500 mb-2 font-bold uppercase">
                           <AlertTriangle className="w-3 h-3" />
                           Parsing Error
                        </div>
                        <div className="h-2 w-3/4 bg-red-900/40 rounded mb-1" />
                        <div className="h-2 w-1/2 bg-red-900/40 rounded" />
                     </div>

                     <div className="space-y-2 opacity-30">
                        <div className="h-3 w-full bg-neutral-900 rounded" />
                        <div className="h-3 w-5/6 bg-neutral-900 rounded" />
                        <div className="h-3 w-full bg-neutral-900 rounded" />
                     </div>

                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/90 border border-red-500 p-6 text-center shadow-2xl backdrop-blur">
                           <div className="text-4xl font-bold text-red-500 mb-2">FAILED</div>
                           <div className="text-red-400 text-xs tracking-widest uppercase">ATS Parsing Confidence: Low</div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </section>

      {/* 3. LOSS AVERSION: THE COST */}
      <section className="bg-neutral-900/30 border-y border-white/5 py-20 px-6">
         <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">The Cost of Doing Nothing</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
               <div className="p-6 rounded-2xl bg-black border border-neutral-800 hover:border-red-900/50 transition-colors group">
                  <Timer className="w-10 h-10 text-neutral-600 mb-4 group-hover:text-red-500 transition-colors mx-auto" />
                  <div className="text-4xl font-bold text-white mb-2">60+</div>
                  <div className="text-neutral-500 text-sm uppercase tracking-wide">Hours Wasted</div>
                  <p className="text-xs text-neutral-600 mt-2">Applying with a broken resume.</p>
               </div>
               
               <div className="p-6 rounded-2xl bg-black border border-neutral-800 hover:border-red-900/50 transition-colors group">
                  <FileWarning className="w-10 h-10 text-neutral-600 mb-4 group-hover:text-red-500 transition-colors mx-auto" />
                  <div className="text-4xl font-bold text-white mb-2">90%</div>
                  <div className="text-neutral-500 text-sm uppercase tracking-wide">Auto-Reject Rate</div>
                  <p className="text-xs text-neutral-600 mt-2">Before human review.</p>
               </div>
               
               <div className="p-6 rounded-2xl bg-black border border-neutral-800 hover:border-red-900/50 transition-colors group">
                  <Lock className="w-10 h-10 text-neutral-600 mb-4 group-hover:text-red-500 transition-colors mx-auto" />
                  <div className="text-4xl font-bold text-white mb-2">$???</div>
                  <div className="text-neutral-500 text-sm uppercase tracking-wide">Salary Lost</div>
                  <p className="text-xs text-neutral-600 mt-2">By delaying your next role.</p>
               </div>
            </div>
         </div>
      </section>

      {/* 4. THE FIX: CTA */}
      <section className="relative py-32 px-6 overflow-hidden">
         {/* Background Pulse */}
         <div className="absolute inset-0 bg-red-600/5 animate-pulse" />
         
         <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tight">
               <GlitchText text="STOP" /> BEING IGNORED.
            </h2>
            <p className="text-xl text-neutral-400 mb-12 max-w-xl mx-auto">
               We can rewrite your resume to pass the ATS filters instantly. 
               Move from the "Reject" pile to the "Interview" list.
            </p>
            
            <Button
               onClick={onGenerateResume}
               className="group relative h-20 px-12 text-2xl font-bold bg-white text-black hover:bg-neutral-200 hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] overflow-hidden"
            >
               <span className="relative z-10 flex items-center gap-3">
                  <ScanEye className="w-8 h-8" />
                  GENERATE ATS-PROOF RESUME
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
               </span>
               
               {/* Shine Effect */}
               <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent z-0" />
            </Button>
            
            <p className="mt-6 text-sm text-neutral-500 font-mono flex items-center justify-center gap-2">
               <Lock className="w-3 h-3" />
               Instant Fix • ATS Validated • 100% Success Rate Boost
            </p>
         </div>
      </section>
      
      <div className="h-24" />
    </div>
  );
}
