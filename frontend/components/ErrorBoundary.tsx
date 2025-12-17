"use client";

import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
            <Card className="bg-neutral-950 border border-red-900/30 rounded-2xl max-w-md w-full">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="text-sm text-neutral-400 mb-4">
                  {this.state.error?.message || "An unexpected error occurred. Please try again."}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full bg-white text-black hover:bg-neutral-200 rounded-lg"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          </main>
        )
      );
    }

    return this.props.children;
  }
}
