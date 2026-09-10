"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function UniversalPwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user dismissed prompt recently
    const dismissedAt = localStorage.getItem("attendex_pwa_dismissed");
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 48) {
        return; // Don't bother for 48 hours
      }
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Capture native Chromium / Android / Desktop beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 2.5 seconds after load before gently showing banner
      setTimeout(() => setShowPrompt(true), 2500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. For iOS, delay showing instructions
    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    } catch (err) {
      console.warn("[PWA] Install prompt exception:", err);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("attendex_pwa_dismissed", Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-4 left-4 right-4 z-[9999] md:max-w-md md:left-auto md:right-4"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-xl shadow-slate-900/10 relative overflow-hidden">
          {/* Subtle top accent highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <div className="flex items-start gap-3 pt-1">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <img
                src="/icons/icon-192.png"
                alt="Attendex Logo"
                className="w-8 h-8 rounded-lg object-contain"
              />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-slate-900 tracking-tight">Install Attendex App</h4>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Install on your device for instant offline access and native speed.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              aria-label="Close"
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-700 active:scale-95 transition-all rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conditional platform action */}
          {deferredPrompt && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
              <Button
                onClick={handleInstallClick}
                disabled={installing}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 shadow-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{installing ? "Installing..." : "Install Now (1-Tap)"}</span>
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-xs text-slate-500 hover:text-slate-800 rounded-xl px-3"
              >
                Later
              </Button>
            </div>
          )}

          {isIos && !deferredPrompt && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                <Share className="w-4 h-4 text-blue-600 shrink-0" />
                <span>1. Tap the <strong className="font-semibold text-slate-900">Share</strong> button in Safari toolbar.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>2. Scroll down & tap <strong className="font-semibold text-slate-900">Add to Home Screen</strong>.</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
