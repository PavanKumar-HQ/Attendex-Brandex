"use client";

import { useState, useEffect } from "react";
import {
  X,
  Share,
  PlusSquare,
  Download,
  Check,
  Smartphone,
  Laptop,
  Monitor,
  Apple,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type Platform = "ios" | "mac" | "windows" | "android" | "other";

export function UniversalPwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect OS / Platform
    const userAgent = window.navigator.userAgent || "";
    const isIosDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isMacDevice = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent) && !isIosDevice;
    const isWindowsDevice = /Win32|Win64|Windows|WinCE/.test(userAgent);
    const isAndroidDevice = /Android/.test(userAgent);

    if (isIosDevice) setPlatform("ios");
    else if (isMacDevice) setPlatform("mac");
    else if (isWindowsDevice) setPlatform("windows");
    else if (isAndroidDevice) setPlatform("android");
    else setPlatform("other");

    // 3. Listen for native Chromium / Android / Edge / Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Always display the floating install notification after 1.5 seconds across all platforms
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const triggerLauncherDownload = () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      if (platform === "windows") {
        const content = `[InternetShortcut]\r\nURL=${origin}/?source=windows_desktop\r\nIconFile=${origin}/favicon.ico\r\nIconIndex=0\r\n`;
        const blob = new Blob([content], { type: "application/internet-shortcut" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Attendex-Setup.url";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Windows Launcher Downloaded", {
          description: "Double-click 'Attendex-Setup.url' to open Attendex in desktop app mode."
        });
      } else if (platform === "mac") {
        const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>URL</key>
  <string>${origin}/?source=mac_desktop</string>
</dict>
</plist>`;
        const blob = new Blob([content], { type: "application/x-apple-webloc" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Attendex.webloc";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("macOS Launcher Downloaded", {
          description: "Drag Attendex.webloc to your Dock or Applications folder."
        });
      } else {
        const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Attendex App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="manifest" href="${origin}/manifest.json">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; text-align: center; }
    .card { background: #fff; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; max-width: 420px; margin: 1rem; }
    .btn { background: #2563eb; color: #fff; text-decoration: none; padding: 0.85rem 1.75rem; border-radius: 0.75rem; font-weight: 700; display: inline-block; margin-top: 1.25rem; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="margin:0 0 0.5rem 0;">Attendex Academic OS</h2>
    <p style="color:#64748b; font-size:0.875rem; margin:0 0 1rem 0;">Launching native application environment...</p>
    <a class="btn" href="${origin}/?source=launcher">Launch Attendex</a>
  </div>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('${origin}/sw.js');
    }
    setTimeout(function() {
      window.location.href = "${origin}/?source=launcher";
    }, 800);
  </script>
</body>
</html>`;
        const blob = new Blob([content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Attendex-App.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Web App Launcher Downloaded", {
          description: "Open the downloaded file to launch Attendex."
        });
      }
    } catch (err) {
      console.warn("[PWA] Download failed:", err);
    }
  };

  const handleInstallClick = async () => {
    setInstalling(true);

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setShowPrompt(false);
          toast.success("Attendex Installed Successfully!");
          return;
        }
      } catch (err) {
        console.warn("[PWA] Native prompt error:", err);
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    }

    // If native prompt not accepted or not supported:
    // 1. Trigger the direct desktop/mobile launcher download file
    triggerLauncherDownload();

    // 2. Open step-by-step visual instructions
    setShowInstructions(true);
    setInstalling(false);
  };

  if (isInstalled || !showPrompt) return null;

  const platformMeta = {
    ios: {
      name: "iOS (iPhone/iPad)",
      badge: "Apple iOS PWA",
      icon: Apple,
      hint: "Add to Home Screen via Safari Share button"
    },
    mac: {
      name: "macOS (MacBook/iMac)",
      badge: "Mac Desktop App",
      icon: Laptop,
      hint: "Add to Dock in Safari or Install in Chrome"
    },
    windows: {
      name: "Windows 10 / 11",
      badge: "Windows Desktop App",
      icon: Monitor,
      hint: "Install via Edge/Chrome or download Windows Launcher"
    },
    android: {
      name: "Android Device",
      badge: "Android PWA",
      icon: Smartphone,
      hint: "1-Tap Install or Chrome Menu > Add to Home screen"
    },
    other: {
      name: "Desktop / Mobile",
      badge: "Universal Web App",
      icon: Monitor,
      hint: "Install to Home Screen or Desktop"
    }
  }[platform];

  const PlatformIcon = platformMeta.icon;

  return (
    <aside aria-label="App Installation" className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-[9999] max-w-sm w-[calc(100vw-1.5rem)] md:w-[380px]">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* Minimized Floating Pill */
          <motion.div
            key="minimized-pill"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="ml-auto w-fit cursor-pointer flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all border border-slate-700/80 group active:scale-95"
          >
            <div className="relative">
              <Download className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            </div>
            <span className="text-xs font-bold tracking-tight">Install Attendex</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </motion.div>
        ) : (
          /* Expanded Floating Notification Card */
          <motion.div
            key="expanded-card"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-2xl shadow-slate-900/15 relative overflow-hidden"
          >
            {/* Top accent border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

            {/* Header row */}
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                  <img
                    src="/icons/icon-192.png"
                    alt="Attendex Logo"
                    className="w-7 h-7 rounded-lg object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 tracking-tight">Install Attendex</h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-0.5">
                      <PlatformIcon className="w-2.5 h-2.5" />
                      {platformMeta.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Native speed, offline mode &amp; 0ms launch
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  aria-label="Minimize"
                  title="Minimize"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  aria-label="Close"
                  title="Close"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Platform description */}
            <div className="mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
              <p>
                Optimized for <strong>{platformMeta.name}</strong>. Enjoy full offline access, biometric login, and push alerts directly on your device.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={handleInstallClick}
                disabled={installing}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {installing
                    ? "Installing..."
                    : deferredPrompt
                    ? "Install App (1-Tap)"
                    : "Install & Download App"}
                </span>
              </Button>

              <Button
                onClick={() => setShowInstructions(!showInstructions)}
                size="sm"
                variant="outline"
                className="text-xs font-semibold text-slate-700 border-slate-200 rounded-xl px-2.5 hover:bg-slate-50"
              >
                {showInstructions ? "Hide Guide" : "How to Install"}
              </Button>
            </div>

            {/* Platform-Specific Step-by-Step Instructions */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs"
                >
                  {platform === "ios" && (
                    <div className="space-y-1.5 text-slate-700">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <Share className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>1. Tap the <strong className="font-semibold text-slate-900">Share</strong> button in Safari toolbar.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>2. Scroll down and tap <strong className="font-semibold text-slate-900">Add to Home Screen</strong>.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <Check className="w-4 h-4 text-slate-900 shrink-0" />
                        <span>3. Tap <strong className="font-semibold text-slate-900">Add</strong> in top-right corner.</span>
                      </div>
                    </div>
                  )}

                  {platform === "mac" && (
                    <div className="space-y-1.5 text-slate-700">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <Apple className="w-4 h-4 text-slate-900 shrink-0" />
                        <span><strong>Safari</strong>: Click <strong className="text-slate-900">File &gt; Add to Dock</strong> to install standalone Mac app.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <Download className="w-4 h-4 text-blue-600 shrink-0" />
                        <span><strong>Chrome/Edge</strong>: Click the install icon in address bar, or use the downloaded <strong className="text-slate-900">Attendex.webloc</strong>.</span>
                      </div>
                    </div>
                  )}

                  {platform === "windows" && (
                    <div className="space-y-1.5 text-slate-700">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <Monitor className="w-4 h-4 text-blue-600 shrink-0" />
                        <span><strong>Edge / Chrome</strong>: Click the <strong className="text-slate-900">Install</strong> icon at the right of your address bar.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>Direct Launcher</strong>: Double-click downloaded <strong className="text-slate-900">Attendex-Setup.url</strong> to run directly.</span>
                      </div>
                    </div>
                  )}

                  {platform === "android" && (
                    <div className="space-y-1.5 text-slate-700">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>1. Tap Chrome menu (<strong className="text-slate-900">3 vertical dots</strong>) in top-right.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <PlusSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>2. Tap <strong className="text-slate-900">Install App</strong> or <strong className="text-slate-900">Add to Home screen</strong>.</span>
                      </div>
                    </div>
                  )}

                  {platform === "other" && (
                    <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-slate-700">
                      <span>Click <strong className="text-slate-900">Install</strong> in your browser's address bar or menu to add Attendex to your applications.</span>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={triggerLauncherDownload}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download Dedicated Launcher File Again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
