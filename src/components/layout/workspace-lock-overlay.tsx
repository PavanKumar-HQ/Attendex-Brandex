"use client";

import { useState, useEffect } from "react";
import { 
  Lock, 
  Unlock, 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  ArrowRight,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWebAuthn } from "@/hooks/use-webauthn";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

export function WorkspaceLockOverlay() {
  const [isLocked, setIsLocked] = useState(false);
  const [userName, setUserName] = useState("Member");
  const { authenticateWithPasskey, device, isLoading } = useWebAuthn();

  useEffect(() => {
    // Check if workspace is locked
    const checkLockState = () => {
      try {
        const locked = sessionStorage.getItem("attendex_workspace_locked");
        setIsLocked(locked === "true");
        const storedName = localStorage.getItem("attendex_user_name");
        if (storedName) setUserName(storedName);
      } catch {}
    };

    checkLockState();

    // Listen for custom lock event
    const handleLockEvent = () => checkLockState();
    window.addEventListener("attendex_lock_state_change", handleLockEvent);
    return () => window.removeEventListener("attendex_lock_state_change", handleLockEvent);
  }, []);

  const handleUnlockClick = async () => {
    haptics.light();
    const res = await authenticateWithPasskey();
    if (res.success) {
      haptics.success();
      sessionStorage.removeItem("attendex_workspace_locked");
      setIsLocked(false);
      window.dispatchEvent(new Event("attendex_lock_state_change"));
      toast.success("Workspace Unlocked", {
        description: `Welcome back, ${userName}!`
      });
    } else {
      haptics.error();
    }
  };

  const handleForceSignOut = () => {
    sessionStorage.removeItem("attendex_workspace_locked");
    document.cookie = "attendex_demo_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    window.location.href = "/login";
  };

  if (!isLocked) return null;

  const SensorIcon = device.type === "FACE_ID" ? ScanFace : Fingerprint;

  return (
    <>
      <div className="fixed inset-0 z-[99998] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm text-center bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl backdrop-blur-md text-white"
        >
          {/* Lock Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-white shadow-xl shadow-black/40 mb-5">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">Workspace Locked</h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Session for <strong className="text-white">{userName}</strong>
          </p>

          <div className="my-6 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-blue-300">
              <SensorIcon className="w-4 h-4" />
              <span>{device.label}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {device.lockScreenName}
            </p>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={handleUnlockClick}
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2"
            >
              <SensorIcon className="w-4 h-4" />
              <span>Unlock with Lock Screen</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleForceSignOut}
              className="w-full h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign In with Password</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
