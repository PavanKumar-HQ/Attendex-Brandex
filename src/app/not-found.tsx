"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-md"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight">404</h1>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Page Not Found</h2>
            <p className="text-slate-500 font-medium text-xs leading-relaxed">
                The academic record or route you're looking for doesn't exist or has been relocated.
            </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
            <Link href="/dashboard" className="h-11 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all flex items-center justify-center shadow-sm">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>
            <Button variant="ghost" onClick={() => window.history.back()} className="h-10 rounded-xl text-slate-500 font-semibold text-xs hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
            </Button>
        </div>
      </motion.div>
      
      <div className="fixed bottom-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] pointer-events-none">
        Attendex Security Protocol
      </div>
    </div>
  );
}

