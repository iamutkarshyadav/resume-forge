
"use client";

import { httpBatchLink, TRPCLink, TRPCClientError } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ErrorProvider } from "@/providers/error-provider";
import { OnboardingProvider } from "@/providers/onboarding-provider";
import { ResumeGenerationProvider } from "@/providers/resume-generation-provider";
import { toast } from "sonner";

import { AppRouter } from "../../../backend/src/trpc/routers/appRouter";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || "v1";
const trpcUrl = `${apiBaseUrl}/api/${apiVersion}/trpc`;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // Retry failed queries once
            refetchOnWindowFocus: false, // Prevent excessive refetching
          },
        },
      })
  );

  const errorLink: TRPCLink<AppRouter> = () => {
    return ({ next, op }) => {
      return observable((observer) => {
        const unsubscribe = next(op).subscribe({
          next: (result) => observer.next(result),
          error: (error) => {
            if (error instanceof TRPCClientError) {
              // Handle specific tRPC errors
              const code = error.data?.code;
              if (code === "UNAUTHORIZED") {
                // Redirect to login or show auth modal
                // Example: window.location.href = '/login';
                toast.error("Authentication expired. Please log in again.");
              } else {
                // Generic error toast
                toast.error(error.message || "An unexpected error occurred.");
              }
            } else {
              // Handle non-tRPC errors (e.g., network issues)
              toast.error("Network error. Please check your connection.");
            }
            observer.error(error);
          },
          complete: () => observer.complete(),
        });
        return unsubscribe;
      });
    };
  };

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
          errorLink,
          httpBatchLink({
            url: trpcUrl,
            headers() {
              if (typeof window === "undefined") return {};
              const token = localStorage.getItem("accessToken");
              return {
                Authorization: token ? `Bearer ${token}` : "",
              };
            },
          }),
        ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
          <ResumeGenerationProvider>
            <OnboardingProvider>{children}</OnboardingProvider>
          </ResumeGenerationProvider>
        </ErrorProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
