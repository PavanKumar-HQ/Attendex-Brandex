"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">System Exception Detected</h1>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              The application encountered an unexpected runtime state. You can reload the instance or return to the main portal.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button 
              onClick={() => reset()}
              className="w-full h-11 rounded-xl bg-white text-slate-950 font-semibold text-xs hover:bg-slate-100 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="w-full h-10 rounded-xl text-slate-400 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Landing
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-500 font-mono">
              Error Digest: {error.digest || "SYS-2026"}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
