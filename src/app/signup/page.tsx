"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Mail, User, Phone, ArrowRight, ShieldCheck, Lock, Building, Crown, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

type UserRole = "STUDENT" | "PARENT";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [role, setRole] = useState<UserRole>("STUDENT");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleSpecificId: "" 
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: role,
          roleSpecificId: formData.roleSpecificId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed. Please check your details.");
      }

      toast.success("Institutional Account Created", {
        description: `Welcome aboard, ${data.user?.name || formData.fullName}! Redirecting to workspace...`
      });

      const redirectPath = 
        role === "STUDENT" ? "/student/dashboard" :
        role === "PARENT" ? "/parent/dashboard" : "/dashboard";

      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1200);
    } catch (err: any) {
      toast.error("Registration Failed", {
        description: err.message || "Contact administrator for institutional enrollment."
      });
      setLoading(false);
    }
  };

  const rolesConfig: { id: UserRole; label: string; icon: any }[] = [
    { id: "STUDENT", label: "Student", icon: User },
    { id: "PARENT", label: "Guardian", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-6 relative overflow-hidden">
      {/* Background ambient blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-[100px] -ml-64 -mb-64 pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between py-2 z-10">
        <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          ← Back to Login
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Registration</span>
        </div>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 z-10 space-y-5 my-6"
      >
        <div className="space-y-1 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-2xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Create Institutional Profile</h1>
          <p className="text-xs text-slate-500 font-medium">Self-registration for enrolled students and legal guardians</p>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-snug">
            <strong>Staff Notice:</strong> Faculty, Principal, and Admin profiles are provisioned directly by Institutional Administration. Self-registration is restricted to Students & Guardians.
          </p>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Account Type</label>
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl gap-1">
            {rolesConfig.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  role === r.id 
                    ? "bg-white text-blue-600 shadow-sm font-black" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <r.icon className="w-4 h-4" />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder={role === "STUDENT" ? "e.g. John Doe" : "e.g. Dr. John Doe"} 
                className="h-11 pl-10 rounded-xl border-slate-200 bg-white focus:bg-white text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={role === "STUDENT" ? "e.g. rollno@college.edu or personal email" : "e.g. parent.email@domain.com"} 
                autoComplete="email"
                className="h-11 pl-10 rounded-xl border-slate-200 bg-white focus:bg-white text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Role-Specific ID */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {role === "STUDENT" ? "Roll / Register Number" : "Student / Ward Roll Number"}
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <Input 
                value={formData.roleSpecificId}
                onChange={(e) => setFormData({ ...formData, roleSpecificId: e.target.value })}
                placeholder={role === "STUDENT" ? "e.g. CS-11 or 21CS042" : "e.g. CS-11 (Child's Roll Number)"} 
                className="h-11 pl-10 rounded-xl border-blue-100 bg-blue-50/20 focus:bg-white text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98450 00000" 
                autoComplete="tel"
                className="h-11 pl-10 rounded-xl border-slate-200 bg-white focus:bg-white text-sm font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters (or DDMMYYYY for student)" 
                autoComplete="new-password"
                className="h-11 pl-10 rounded-xl border-slate-200 bg-white focus:bg-white text-sm font-medium"
                required
              />
            </div>
          </div>

          <Button 
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold uppercase tracking-wider shadow-lg hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Creating Account..." : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
          <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors">
            Already have an account? <span className="text-blue-600 underline">Sign In</span>
          </Link>
          <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PostgreSQL Secured</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Powered By Brandex with Hyperlink */}
      <div className="w-full py-3">
        <PoweredByBrandex variant="footer" />
      </div>
    </div>
  );
}
