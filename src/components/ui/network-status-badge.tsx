"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { offlineSyncQueue, QueuedRequest } from "@/lib/offline-sync-queue";

export function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      setTimeout(() => setJustCameOnline(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustCameOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribe = offlineSyncQueue.subscribe((queue: QueuedRequest[]) => {
      setPendingCount(queue.length);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  if (isOnline && pendingCount === 0 && !justCameOnline) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none"
      >
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-amber-200 shadow-md backdrop-blur-md text-slate-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Offline Mode • Changes Queued</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </div>
        )}

        {isOnline && pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-blue-200 shadow-md backdrop-blur-md text-slate-800 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Syncing {pendingCount} Pending Operation{pendingCount > 1 ? "s" : ""}...</span>
          </div>
        )}

        {isOnline && pendingCount === 0 && justCameOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-emerald-200 shadow-md backdrop-blur-md text-slate-800 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connection Restored • Synchronized</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
