"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const ANALYSIS_STATE_KEY = ["analysisState"];

interface AnalysisState {
  selectedResumeId: string | null;
  selectedJdId: string | null;
  setSelectedResumeId: (id: string | null) => void;
  setSelectedJdId: (id: string | null) => void;
}

const AnalysisContext = createContext<AnalysisState | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: state } = useQuery({
    queryKey: ANALYSIS_STATE_KEY,
    queryFn: () => ({ selectedResumeId: null, selectedJdId: null }),
    staleTime: Infinity,
    gc: Infinity,
  });

  const setSelectedResumeId = (id: string | null) => {
    queryClient.setQueryData(ANALYSIS_STATE_KEY, (old: any) => ({ ...old, selectedResumeId: id }));
  };

  const setSelectedJdId = (id: string | null) => {
    queryClient.setQueryData(ANALYSIS_STATE_KEY, (old: any) => ({ ...old, selectedJdId: id }));
  };

  const value = {
    selectedResumeId: state?.selectedResumeId ?? null,
    selectedJdId: state?.selectedJdId ?? null,
    setSelectedResumeId,
    setSelectedJdId,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisState() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysisState must be used within an AnalysisProvider");
  }
  return context;
}
