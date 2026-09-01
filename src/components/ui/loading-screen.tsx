"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Core animated shape */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="relative w-16 h-16 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 0.9, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <GraduationCap className="w-6 h-6 text-slate-900" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center flex flex-col items-center gap-1"
      >
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendex</h2>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
          <p className="text-xs font-medium text-slate-500">Initializing Workspace...</p>
        </div>
      </motion.div>

      {/* Subtle Progress Bar */}
      <div className="mt-8 w-32 h-1 bg-slate-100 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/2 bg-slate-900 rounded-full"
        />
      </div>
    </div>
  );
}
