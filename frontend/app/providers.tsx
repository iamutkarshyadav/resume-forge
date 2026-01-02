"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ErrorProvider } from "@/providers/error-provider";
import { OnboardingProvider } from "@/providers/onboarding-provider";
import { ResumeGenerationProvider } from "@/providers/resume-generation-provider";
import { toast } from "sonner";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || "v1";
const trpcUrl = `${apiBaseUrl}/api/${apiVersion}/trpc`;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          throwOnError: (error: any) => {
            // Only throw on critical errors, toast other errors
            const code = error?.data?.code;
            if (code === "UNAUTHORIZED") {
              // Let auth handler manage auth errors
              return false;
            }
            if (code === "FORBIDDEN" || code === "NOT_FOUND") {
              // Non-critical errors
              return false;
            }
            return true;
          },
        },
        mutations: {
          throwOnError: true,
        },
      },
    })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: trpcUrl,
          headers() {
            if (typeof window === "undefined") return {};
            const token = localStorage.getItem("accessToken");
            return {
              Authorization: token ? `Bearer ${token}` : "",
            };
          },
          async onError(opts) {
            const { error } = opts;
            const code = error?.data?.code;

            // Log errors for debugging, but don't toast auth/validation errors
            // (they're expected and handled by UI)
            if (!["UNAUTHORIZED", "FORBIDDEN", "BAD_REQUEST", "NOT_FOUND"].includes(code)) {
              const message = error?.message || "Request failed. Please try again.";
              console.warn(`[tRPC Error] ${code}: ${message}`);
            }
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
