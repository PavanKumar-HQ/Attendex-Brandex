"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, ShieldAlert, WifiOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for institutional auditing
    console.error("Institutional Recovery Triggered:", error);
    haptics.error();
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Security Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-blue-600/5 blur-[120px] rounded-full -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Hardware-Grade Security Icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-md">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 shadow-sm">
              <WifiOff className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Session Temporarily Offline
            </h1>
            <p className="text-slate-400 font-medium text-xs leading-relaxed">
              We're having trouble connecting to the network. Your progress has been 
              <span className="text-blue-400 font-semibold"> cached locally </span> and will synchronize automatically.
            </p>
          </div>

          <div className="w-full space-y-2 pt-2">
            <Button
              onClick={() => {
                haptics.light();
                reset();
              }}
              className="w-full h-11 rounded-xl bg-white text-slate-950 font-semibold text-xs hover:bg-slate-100 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Reconnecting
            </Button>
            
            <Link href="/dashboard" className="block w-full">
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl border-slate-800 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Institutional Audit Info */}
          <div className="pt-6 border-t border-slate-800 w-full flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Error Signature: {error.digest?.slice(0, 8) || "ROPE-SEC-404"}
            </div>
            <span>Status: Recovery Mode</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
