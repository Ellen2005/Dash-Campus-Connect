"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundaryWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[Dash Error Boundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-headline font-bold">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message ?? "An unexpected error occurred. Please try again."}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
              <Button onClick={() => window.location.href = "/"} className="dash-button-primary">
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">Error details</summary>
                <pre className="text-[10px] text-destructive bg-destructive/5 p-3 rounded-lg mt-2 overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
