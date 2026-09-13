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
          exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white text-slate-900 selection:bg-none pointer-events-auto"
        >
          {/* Pure Brandex Logo - Floating with smooth cinematic reveal */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.02, opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center p-6"
          >
            <img
              src="/brandex-logo.png"
              alt="Brandex"
              className="h-16 sm:h-20 w-auto object-contain select-none pointer-events-none drop-shadow-sm"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
