"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Mail, ArrowLeft, KeyRound, Sparkles, User, ShieldCheck, CheckCircle2, Lock, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [role, setRole] = useState<"STUDENT" | "STAFF">("STUDENT");
  const [step, setStep] = useState<"VERIFY" | "RESET" | "SUCCESS">("VERIFY");
  const [loading, setLoading] = useState(false);

  // Step 1: Verification
  const [identifier, setIdentifier] = useState("");
  const [registeredContact, setRegisteredContact] = useState("");

  // Step 2: Reset
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [maskedContact, setMaskedContact] = useState("");
  const [studentName, setStudentName] = useState("");

  const handleRequestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !registeredContact.trim()) {
      return toast.error("All fields are required");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          identifier: identifier.trim(),
          registered_contact: registeredContact.trim()
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Verification failed");
      }

      setMaskedContact(json.maskedContact || registeredContact);
      setStudentName(json.studentName || json.staffName || "");
      if (json.pin) setPin(json.pin); // Pre-fill one-time PIN for testing/demo convenience

      setStep("RESET");
      toast.success("Identity Verified", {
        description: `Recovery PIN generated for ${json.studentName || "your account"}.`
      });
    } catch (err: any) {
      toast.error("Recovery Verification Failed", {
        description: err.message || "Credentials not found in institutional database."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || !newPassword.trim()) {
      return toast.error("PIN and new credentials are required");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          pin: pin.trim(),
          new_password: newPassword.trim()
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update password");
      }

      setStep("SUCCESS");
      toast.success("Account Credentials Secured", {
        description: json.message
      });
    } catch (err: any) {
      toast.error("Password Update Failed", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[320px] bg-blue-600/5 -skew-y-6 -mt-32" />

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/5"
      >
        <div>
           <Link href="/login" className="inline-flex items-center text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors group uppercase tracking-widest mb-4">
             <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
             Back to Identity Portal
           </Link>

           <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                <KeyRound className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recover Access</h1>
               <p className="text-slate-500 font-semibold text-xs">
                 Institutional Credential Recovery
               </p>
             </div>
           </div>
        </div>

        {step !== "SUCCESS" && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setRole("STUDENT"); setStep("VERIFY"); }}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                role === "STUDENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole("STAFF"); setStep("VERIFY"); }}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                role === "STAFF" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Faculty / Parent</span>
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "VERIFY" && (
            <motion.form 
              key="verify-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleRequestPin} 
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {role === "STUDENT" ? "Roll Number / Register Number" : "Institutional Email / Username"}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={role === "STUDENT" ? "e.g. CS-11, CS-12, 21CS042" : "e.g. faculty.cs@attendex.institution.edu"} 
                    className="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50 font-medium text-xs focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {role === "STUDENT" ? "Registered Email or Parent Phone" : "Registered Recovery Phone / Email"}
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="text"
                    value={registeredContact}
                    onChange={(e) => setRegisteredContact(e.target.value)}
                    placeholder={role === "STUDENT" ? "e.g. student@attendex.edu or 9845011010" : "e.g. +91 98765 00002"} 
                    className="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50 font-medium text-xs focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/10 hover:bg-blue-700 transition-all"
              >
                {loading ? "Verifying Registry..." : "Verify & Generate Recovery Code"}
              </Button>
            </motion.form>
          )}

          {step === "RESET" && (
            <motion.form 
              key="reset-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleResetPassword} 
              className="space-y-4"
            >
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-bold">Verification code dispatched to {maskedContact}</p>
                <p className="text-[11px] text-blue-700">Enter the 6-digit code below to set your new password.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">6-Digit Verification PIN</label>
                <Input 
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 842109" 
                  className="h-12 text-center tracking-widest text-lg font-mono font-bold rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {role === "STUDENT" ? "New Date of Birth (DDMMYYYY)" : "New Secure Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={role === "STUDENT" ? "DDMMYYYY (e.g. 15082004)" : "Enter at least 8 characters"} 
                    className="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50 font-medium text-xs focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setStep("VERIFY")}
                  className="h-12 flex-1 rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Change Details
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="h-12 flex-[2] rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10"
                >
                  {loading ? "Updating..." : "Commit New Credentials"}
                </Button>
              </div>
            </motion.form>
          )}

          {step === "SUCCESS" && (
            <motion.div 
              key="success-box"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-slate-900 font-bold text-sm">Credentials Successfully Updated</h3>
                 <p className="text-slate-600 text-xs leading-relaxed">
                   Your new credentials have been encrypted and committed to the database. You can now log in securely.
                 </p>
              </div>
              <Link href="/login" className="block w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                Proceed to Secure Sign In
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center pt-2 border-t border-slate-100">
           <p className="text-[10px] font-bold text-slate-400 tracking-wider">ATTENDEX CRYPTOGRAPHIC SECURITY ENGINE</p>
        </div>
      </motion.div>
    </div>
  );
}
