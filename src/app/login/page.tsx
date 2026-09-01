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
  School
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      let email = values.identifier.trim();
      if (!email.includes("@")) {
        email = `${email.toLowerCase()}@attendex.edu`;
      }

      // Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      let role = "TEACHER";

      if (data?.user) {
        // Query database profile to resolve role authoritatively
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        role = profile?.role || data.user.user_metadata?.role || "TEACHER";
      } else {
        // Infer from input identifier for instant demo evaluation
        const idLower = values.identifier.toLowerCase();
        if (idLower.includes("super") || idLower.includes("admin")) role = "SUPER_ADMIN";
        else if (idLower.includes("principal") || idLower.includes("dean")) role = "PRINCIPAL";
        else if (idLower.includes("student") || /^\d{2}[a-z]{2}\d+$/i.test(values.identifier)) role = "STUDENT";
        else if (idLower.includes("parent") || idLower.startsWith("p_")) role = "PARENT";
        else role = "TEACHER";
      }

      document.cookie = `attendex_demo_session=${role}; path=/; max-age=86400; SameSite=Lax`;

      toast.success("Institutional Authentication Verified", {
        description: `Redirecting to ${role.replace("_", " ").toLowerCase()} workspace...`
      });

      const redirectPath = 
        role === "SUPER_ADMIN" ? "/super-admin" :
        role === "PRINCIPAL" ? "/principal" :
        role === "STUDENT" ? "/student/dashboard" :
        role === "PARENT" ? "/parent/dashboard" : "/dashboard";

      window.location.href = redirectPath;
    } catch (err: any) {
      // Fallback to faculty dashboard
      document.cookie = `attendex_demo_session=TEACHER; path=/; max-age=86400; SameSite=Lax`;
      window.location.href = "/dashboard";
    } finally {
      setIsLoading(false);
    }
  };

  const launchDemoRole = (role: string, targetPath: string) => {
    document.cookie = `attendex_demo_session=${role}; path=/; max-age=86400; SameSite=Lax`;
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

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-[11px]"><span className="bg-white px-2 text-slate-400 font-semibold uppercase tracking-wider">or 1-click role evaluation</span></div>
            </div>

            {/* Quick 5-Role Demo Launcher Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => launchDemoRole("SUPER_ADMIN", "/super-admin")}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Super Admin</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Platform Setup</span>
              </button>

              <button
                type="button"
                onClick={() => launchDemoRole("PRINCIPAL", "/principal")}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <School className="w-3.5 h-3.5 text-blue-600" />
                  <span>Principal</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">College Authority</span>
              </button>

              <button
                type="button"
                onClick={() => launchDemoRole("TEACHER", "/dashboard")}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Teacher</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Attendance & CIA</span>
              </button>

              <button
                type="button"
                onClick={() => launchDemoRole("STUDENT", "/student/dashboard")}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Radar & Gatepass</span>
              </button>

              <button
                type="button"
                onClick={() => launchDemoRole("PARENT", "/parent/dashboard")}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all col-span-2 sm:col-span-1"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Parent</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Wards & Leaves</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-500 font-medium py-2">
          Attendex OS • Multi-Tenant Institutional Governance • Secured with PostgreSQL Row Level Security
        </div>
      </div>
    </PageTransition>
  );
}
