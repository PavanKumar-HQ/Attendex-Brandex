"use client";

import { useState } from "react";
import { 
  Fingerprint, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  Laptop, 
  KeyRound, 
  Trash2, 
  RefreshCw,
  ScanFace
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { haptics } from "@/lib/haptics";
import { useWebAuthn } from "@/hooks/use-webauthn";
import { motion, AnimatePresence } from "framer-motion";

export function PasskeyCard() {
  const { 
    registerPasskey, 
    authenticateWithPasskey, 
    removePasskey, 
    isLoading, 
    device, 
    isEnrolled, 
    enrolledPasskey 
  } = useWebAuthn();

  const [isTesting, setIsTesting] = useState(false);

  const handleEnroll = async () => {
    haptics.light();
    const ok = await registerPasskey();
    if (ok) {
      haptics.success();
    } else {
      haptics.error();
    }
  };

  const handleTestScan = async () => {
    haptics.light();
    setIsTesting(true);
    const result = await authenticateWithPasskey();
    setIsTesting(false);
    if (result.success) {
      haptics.success();
    } else {
      haptics.error();
    }
  };

  const handleRemove = () => {
    haptics.light();
    removePasskey();
  };

  const DeviceIcon = device.platform === "iOS" || device.platform === "Android" 
    ? Smartphone 
    : Laptop;

  const SensorIcon = device.type === "FACE_ID" 
    ? ScanFace 
    : Fingerprint;

  return (
    <Card className="p-6 sm:p-8 border-slate-200/90 shadow-sm rounded-3xl bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 relative overflow-hidden group">
      {/* Decorative Security Watermark */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <ShieldCheck className="w-36 h-36 text-slate-900" />
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <SensorIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Biometric Authentication
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                  <DeviceIcon className="w-3 h-3" />
                  {device.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Compatible with iOS Face ID, Android Fingerprint, macOS Touch ID &amp; Windows Hello
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Bind your physical device sensor to log into your Attendex workspace instantly. All biometric processing remains securely encrypted on your local device.
          </p>

          {/* Enrolled Details Banner */}
          <AnimatePresence>
            {isEnrolled && enrolledPasskey && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>Hardware Bound</span>
                      <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-mono px-1.5 py-0.2 rounded">ACTIVE</span>
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Enrolled: {enrolledPasskey.platform} ({new Date(enrolledPasskey.registeredAt).toLocaleDateString()})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestScan}
                    disabled={isTesting || isLoading}
                    className="h-8 px-3 rounded-xl bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 text-xs font-bold shadow-2xs"
                  >
                    <SensorIcon className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    {isTesting ? "Scanning..." : "Test Sensor"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemove}
                    disabled={isLoading}
                    className="h-8 px-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full md:w-auto">
          {!isEnrolled ? (
            <Button 
              onClick={handleEnroll}
              disabled={isLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 h-13 px-7 rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all font-bold text-sm group"
            >
              <SensorIcon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>{isLoading ? "Enrolling Sensor..." : "Enable Fingerprint / Face ID"}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />}
            </Button>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-emerald-700 bg-white border border-emerald-200 px-4 py-3 rounded-2xl shadow-2xs text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sensor Ready for Quick Login</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {[
          { label: "Android & iOS Native", desc: "Face ID, Touch ID & Android sensors", icon: Smartphone },
          { label: "Hardware-Level Security", desc: "No passwords transmitted or stored", icon: ShieldCheck },
          { label: "Instant Access", desc: "Single-touch dashboard login", icon: Sparkles }
        ].map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-white/70 border border-slate-200/80 p-3.5 rounded-2xl shadow-2xs backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
              <item.icon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{item.label}</p>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
