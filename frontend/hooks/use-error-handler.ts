"use client";

import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import { useCallback } from "react";

interface ErrorInfo {
  code?: string;
  message: string;
  status?: number;
}

export function useErrorHandler() {
  const handleError = useCallback((error: any): ErrorInfo => {
    // Handle tRPC errors
    if (error instanceof TRPCClientError) {
      const message = error.message || "An unexpected error occurred";
      const code = error.data?.code || "INTERNAL_SERVER_ERROR";
      
      // Don't show error toast for expected auth/validation errors - let UI handle it
      if (!["UNAUTHORIZED", "FORBIDDEN", "BAD_REQUEST"].includes(code)) {
        toast.error(message);
      }
      
      console.warn(`[tRPC Error] ${code}: ${message}`);
      return { code, message, status: error.shape?.data?.httpStatus };
    }
    
    // Handle standard errors
    if (error instanceof Error) {
      const message = error.message || "An unexpected error occurred";
      toast.error(message);
      console.error("[Error]", message, error);
      return { message };
    }
    
    // Handle unknown errors
    const message = "An unexpected error occurred";
    toast.error(message);
    console.error("[Unknown Error]", error);
    return { message };
  }, []);

  return { handleError };
}
