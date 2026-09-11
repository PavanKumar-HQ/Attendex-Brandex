"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/ui/page-transition";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/schemas";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  GraduationCap, 
  ArrowRight, 
  Shield, 
  Lock, 
  Building2,
  Users,
  BookOpen,
  Crown,
  School,
  UserPlus
} from "lucide-react";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showDobHelper, setShowDobHelper] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleLookup = async (q: string) => {
    setLookupQuery(q);
    if (!q || q.trim().length < 2) {
      setLookupResults([]);
      return;
    }
    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/auth/student-lookup?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.success) {
        setLookupResults(json.results || []);
      }
    } catch {
      setLookupResults([]);
    } finally {
      setIsLookingUp(false);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const rawIdentifier = values.identifier.trim();
      const rawPassword = values.password.trim();

      // 1. Check if user is logging in as a student using Register Number / Roll No & DOB
      const isLikelyStudent = (
        !rawIdentifier.includes("@") ||
        rawIdentifier.toLowerCase().endsWith("@attendex.edu") ||
        /^(cs|reg|21cs|\d+)/i.test(rawIdentifier)
      );

      if (isLikelyStudent) {
        try {
          const studentRes = await fetch("/api/auth/student-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: rawIdentifier, password: rawPassword })
          });
          const studentJson = await studentRes.json();

          if (studentJson.success && studentJson.student) {
            toast.success(`Welcome, ${studentJson.student.name}!`, {
              description: `Authenticated with Register #${studentJson.student.roll_number} (${studentJson.student.class_name}).`
            });
            window.location.href = "/student/dashboard";
            return;
          } else if (studentRes.status === 401 && !rawIdentifier.includes("@")) {
            // Identifier was clearly a student register number but password/DOB failed
            toast.error("Authentication Failed", {
              description: studentJson.message || "Invalid credentials. Password is your Date of Birth (DDMMYYYY)."
            });
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall through to general institutional sign-in
        }
      }

      // 2. Staff, Faculty, Principal & Admin Authentication via Server API
      const staffRes = await fetch("/api/auth/faculty-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: rawIdentifier, password: rawPassword })
      });

      const staffJson = await staffRes.json();

      if (!staffRes.ok || !staffJson.success) {
        toast.error("Authentication Failed", {
          description: staffJson.message || "Invalid credentials. Please check your identifier and password."
        });
        setIsLoading(false);
        return;
      }

      const role = staffJson.role || "TEACHER";

      toast.success("Institutional Authentication Verified", {
        description: `Welcome back, ${staffJson.user?.name || "User"}! Redirecting to ${role.replace("_", " ").toLowerCase()} workspace...`
      });

      const redirectPath = 
        role === "SUPER_ADMIN" ? "/super-admin" :
        role === "PRINCIPAL" ? "/principal" :
        role === "STUDENT" ? "/student/dashboard" :
        role === "PARENT" ? "/parent/dashboard" : "/dashboard";

      window.location.href = redirectPath;
    } catch (err: any) {
      toast.error("Sign-In Error", {
        description: err?.message || "An unexpected error occurred during authentication."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const launchDemoRole = (role: string, targetPath: string, studentRoll?: string) => {
    document.cookie = `attendex_demo_session=${role}; path=/; max-age=86400; SameSite=Lax`;
    if (studentRoll) {
      document.cookie = `attendex_student_roll=${studentRoll}; path=/; max-age=86400; SameSite=Lax`;
    }
    toast.success(`Access Granted: ${role.replace("_", " ")} Workspace`);
    window.location.href = targetPath;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6">
        {/* Top Header */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
          <Link href="/" className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <span>Attendex <span className="text-xs font-semibold text-slate-500">Academic Cloud</span></span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            ← Back to Overview
          </Link>
        </div>

        {/* Center Auth Card */}
        <div className="w-full max-w-[420px] mx-auto my-6">
          <div className="text-center mb-6 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-semibold mb-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Unified Institutional Sign-In</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Access Your Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Enter your university ID or email. Your role is determined automatically.</p>
          </div>

          <Card className="p-6 md:p-8 border-slate-200/90 bg-white shadow-sm rounded-2xl space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-bold text-slate-700">
                  Email / Institutional ID
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  {...register("identifier")}
                  placeholder="e.g. principal@college.edu or 21CS042"
                  autoComplete="username"
                  className={cn(
                    "h-11 rounded-lg border-slate-200 bg-white text-slate-900 text-sm focus-visible:ring-slate-900",
                    errors.identifier && "border-red-500"
                  )}
                />
                {errors.identifier && <p className="text-xs text-red-500">{errors.identifier.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                  <Link href="/forgot-password" title="Recover Access" className="text-xs font-semibold text-blue-600 hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                      "h-11 rounded-lg border-slate-200 bg-white text-slate-900 text-sm focus-visible:ring-slate-900 pr-10",
                      errors.password && "border-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 space-y-1.5 shadow-sm">
                <div className="font-bold flex items-center justify-between text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    Student Default Credentials:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDobHelper(true);
                      handleLookup("CS");
                    }}
                    className="text-blue-700 underline font-semibold hover:text-blue-950 text-[11px]"
                  >
                    Forgot DOB?
                  </button>
                </div>
                <div className="text-slate-600 space-y-0.5 font-medium leading-relaxed">
                  <div>• <strong>Username:</strong> Your Register / Roll Number (e.g. <code className="bg-white px-1 py-0.5 rounded text-blue-800 font-mono text-[10px]">CS-11</code>, <code className="bg-white px-1 py-0.5 rounded text-blue-800 font-mono text-[10px]">CS-12</code>, <code className="bg-white px-1 py-0.5 rounded text-blue-800 font-mono text-[10px]">21CS042</code>)</div>
                  <div>• <strong>Password:</strong> Your Date of Birth in DDMMYYYY format (e.g. <code className="bg-white px-1 py-0.5 rounded text-blue-800 font-mono text-[10px]">15082004</code> for 15-Aug-2004)</div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-[11px]"><span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider">New Institutional Member?</span></div>
            </div>

            {/* Direct Account Registration Action */}
            <div className="space-y-2">
              <Link
                href="/signup"
                className="w-full h-11 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-900 hover:text-white text-slate-900 font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all group"
              >
                <UserPlus className="w-4 h-4 text-blue-600 group-hover:text-blue-400" />
                <span>Create Institutional Account</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-[11px] text-center text-slate-400">
                Enroll as Faculty, Student, Principal, Admin, or Guardian
              </p>
            </div>
          </Card>
        </div>

        {/* Student Credential Recovery / DOB Helper Modal */}
        {showDobHelper && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Student Credential Recovery</h3>
                    <p className="text-[11px] text-slate-500">Find your Register Number &amp; default DOB password</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDobHelper(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Search by Name or Register No:</label>
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => handleLookup(e.target.value)}
                    placeholder="e.g. Aarav, Ishani, CS-11, 21CS042"
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {isLookingUp ? (
                    <div className="py-6 text-center text-xs text-slate-400">Searching registry...</div>
                  ) : lookupResults.length > 0 ? (
                    lookupResults.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setValue("identifier", s.roll_number);
                          setShowDobHelper(false);
                          toast.info(`Selected ${s.name}`, {
                            description: `Register No: ${s.roll_number}. Enter password: ${s.dob_hint} (in DDMMYYYY format)`
                          });
                        }}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{s.name}</span>
                          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                            {s.roll_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                          <span>{s.class_name}</span>
                          <span className="font-semibold text-emerald-700">DOB: {s.dob_hint}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Type your name or roll number above to retrieve your credentials.
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                  💡 <strong>Password Rule:</strong> Your default password is your Date of Birth in <span className="font-mono font-bold">DDMMYYYY</span> format without spaces or symbols. (Example: Born 15-Aug-2004 $\rightarrow$ enter <span className="font-mono font-bold">15082004</span>).
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setShowDobHelper(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center gap-2 py-3">
          <PoweredByBrandex variant="footer" />
          <p className="text-[11px] text-slate-400 font-medium">
            Attendex OS • Multi-Tenant Institutional Governance • Secured with PostgreSQL Row Level Security
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
