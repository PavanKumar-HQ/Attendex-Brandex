"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Fingerprint, 
  ScanFace, 
  Lock, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  ArrowRight, 
  X,
  KeyRound,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { BiometricDevice } from "@/hooks/use-webauthn";

interface BiometricPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  device: BiometricDevice;
  actionType: "LOGIN" | "ENROLL" | "UNLOCK";
  isLoading?: boolean;
}

export function BiometricPermissionModal({
  isOpen,
  onClose,
  onConfirm,
  device,
  actionType,
  isLoading = false
}: BiometricPermissionModalProps) {
  if (!isOpen) return null;

  const DeviceIcon = device.platform === "iOS" || device.platform === "Android" 
    ? Smartphone 
    : Laptop;

  const SensorIcon = device.type === "FACE_ID" 
    ? ScanFace 
    : Fingerprint;

  const getActionTitle = () => {
    switch (actionType) {
      case "LOGIN":
        return "Sign In with Lock Screen Biometrics";
      case "ENROLL":
        return "Authorize Lock Screen Biometrics";
      case "UNLOCK":
        return "Unlock Workspace with Lock Screen Biometrics";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md z-10"
        >
          <Card className="p-6 sm:p-7 bg-white rounded-3xl border-slate-200/90 shadow-2xl overflow-hidden relative">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/15 shrink-0">
                <SensorIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <DeviceIcon className="w-3 h-3" />
                    {device.label}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-1 leading-snug">
                  {getActionTitle()}
                </h3>
              </div>
            </div>

            {/* Permission Explanation */}
            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed mb-6">
              <p className="font-medium text-slate-700">
                {device.permissionDescription}
              </p>

              {/* Security & Verification Checklist */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Lock Screen Credentials</span>
                    <p className="text-[11px] text-slate-500">{device.lockScreenName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Zero-Trust Privacy</span>
                    <p className="text-[11px] text-slate-500">Biometric data is processed strictly by your device operating system.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Multi-Platform Compatibility</span>
                    <p className="text-[11px] text-slate-500">Supports Android lock screen, Windows Hello &amp; macOS Touch ID.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Awaiting Lock Screen Scan...</span>
                  </>
                ) : (
                  <>
                    <SensorIcon className="w-4 h-4 text-blue-400" />
                    <span>Authorize &amp; Scan Lock Screen</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
