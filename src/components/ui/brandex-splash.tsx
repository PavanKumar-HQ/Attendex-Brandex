"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function BrandexSplash() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Show entry animation once per browser session or initial mount
    const hasSeenSplash = sessionStorage.getItem("attendex_brandex_splash_seen");
    if (!hasSeenSplash) {
      setShowSplash(true);
      sessionStorage.setItem("attendex_brandex_splash_seen", "true");

      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="brandex-splash-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/98 backdrop-blur-xl text-slate-900 selection:bg-none pointer-events-auto"
        >
          {/* Subtle Ambient Backlight on Light Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.15 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-blue-400 via-indigo-300 to-sky-300 blur-3xl"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6">
            {/* Logo container with scale and glow animation */}
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-4 rounded-2xl bg-white shadow-xl shadow-blue-600/10 border border-slate-200/80"
            >
              <img
                src="/brandex-logo.png"
                alt="Brandex Logo"
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </motion.div>

            {/* Subtitle animation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-6 flex flex-col items-center gap-1.5"
            >
              <span className="text-xs uppercase tracking-[0.25em] text-blue-600 font-bold">
                Powered by Brandex
              </span>
              <p className="text-[12px] text-slate-500 font-medium">
                Next-Generation Academic Operating System
              </p>
            </motion.div>

            {/* Micro loading track */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 140, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.9, ease: "easeInOut" }}
              className="mt-5 h-1 rounded-full bg-slate-100 overflow-hidden"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                className="h-full w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
