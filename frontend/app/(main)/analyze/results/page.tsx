"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisResults } from "@/components/AnalysisResults";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AnalysisResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const matchId = searchParams.get("matchId");
  const jdId = searchParams.get("jdId");

  if (!matchId || !jdId) {
    // This check runs on the client. If params are missing, redirect.
    if (typeof window !== "undefined") {
      toast.error("Analysis results not found. Please try again.");
      router.push("/analyze");
    }
    return null; // Return null during server render if params are missing
  }
  
  const matchQuery = trpc.match.getMatch.useQuery({ matchId });

  const handleGenerateResume = () => {
    if (!matchQuery.data?.resumeId || !jdId) {
      toast.error("Could not find the necessary IDs to generate a resume. Please analyze again.");
      router.push("/analyze");
      return;
    }
    
    const params = new URLSearchParams({
      resumeId: matchQuery.data.resumeId,
      jdId: jdId,
    });
    router.push(`/resume/generate?${params.toString()}`);
  };

  if (matchQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-2">
            <div className="w-16 h-16 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (matchQuery.error || !matchQuery.data) {
    // Safely extract error message
    const errorMessage = matchQuery.error?.message || matchQuery.error?.data?.message || "An unknown error occurred.";
    
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4 p-8 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400">Error Loading Results</h2>
            <p className="text-muted-foreground max-w-sm">{errorMessage}</p>
             <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/analyze")}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back to Analyze
              </Button>
        </div>
      </div>
    );
  }
  
  // The AnalysisResults component expects the data wrapped in a `match` object.
  const analysisData = { match: matchQuery.data };

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <AnalysisResults
          data={analysisData}
          onGenerateResume={handleGenerateResume}
          onAnalyzeAnother={() => router.push("/analyze")}
        />
      </div>
    </main>
  );
}
