"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/ui/page-transition";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
  Crown,
  School,
  UserPlus,
  LogIn,
  User,
  Mail,
  Phone,
  ShieldCheck
} from "lucide-react";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

type AuthTab = "signin" | "signup";
type SignupRole = "STUDENT" | "PARENT";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");

  // Sign In state
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up state (Only Student and Parent self-registration permitted)
  const [isRegistering, setIsRegistering] = useState(false);
  const [signupRole, setSignupRole] = useState<SignupRole>("STUDENT");
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleSpecificId: ""
  });

  // ─── Sign In Submission ───
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error("Required Fields Missing", { description: "Please enter your identifier and password." });
      return;
    }

    setIsSigningIn(true);
    const rawId = identifier.trim();
    const rawPass = password.trim();

    try {
      // 1. Check if user is logging in as a student using Register Number / Roll No & DOB
      const isLikelyStudent = (
        !rawId.includes("@") ||
        rawId.toLowerCase().endsWith("@attendex.edu") ||
        /^(cs|reg|21cs|\d+)/i.test(rawId)
      );

      if (isLikelyStudent) {
        try {
          const studentRes = await fetch("/api/auth/student-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: rawId, password: rawPass })
          });
          const studentJson = await studentRes.json();

          if (studentJson.success && studentJson.student) {
            try {
              localStorage.setItem("attendex_user_name", studentJson.student.name);
            } catch {}
            toast.success(`Welcome, ${studentJson.student.name}!`, {
              description: `Authenticated with Register #${studentJson.student.roll_number}.`
            });
            window.location.href = "/student/dashboard";
            return;
          } else if (studentRes.status === 401 && !rawId.includes("@")) {
            toast.error("Authentication Failed", {
              description: studentJson.message || "Invalid credentials."
            });
            setIsSigningIn(false);
            return;
          }
        } catch {
          // Fall through to general staff sign-in
        }
      }

      // 2. Staff, Faculty, Principal & Admin Authentication via Server API
      const staffRes = await fetch("/api/auth/faculty-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: rawId, password: rawPass })
      });

      const staffJson = await staffRes.json();

      if (!staffRes.ok || !staffJson.success) {
        toast.error("Authentication Failed", {
          description: staffJson.message || "Invalid credentials. If you do not have an account, please switch to Create Account."
        });
        setIsSigningIn(false);
        return;
      }

      const role = staffJson.role || "TEACHER";
      const facultyName = staffJson.user?.name || "User";
      try {
        localStorage.setItem("attendex_user_name", facultyName);
      } catch {}

      toast.success("Authentication Verified", {
        description: `Welcome back, ${facultyName}! Redirecting to workspace...`
      });

      const redirectPath = 
        role === "SUPER_ADMIN" || role === "ADMIN" ? "/super-admin" :
        role === "PRINCIPAL" ? "/principal" :
        role === "STUDENT" ? "/student/dashboard" :
        role === "PARENT" ? "/parent/dashboard" : "/dashboard";

      window.location.href = redirectPath;
    } catch (err: any) {
      toast.error("Sign-In Error", {
        description: err?.message || "An unexpected error occurred during authentication."
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // ─── Sign Up Submission ───
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.fullName.trim() || !signupForm.password.trim()) {
      toast.error("Required Fields Missing", { description: "Full Name and Password are required." });
      return;
    }

    setIsRegistering(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: signupForm.fullName,
          email: signupForm.email,
          phone: signupForm.phone,
          password: signupForm.password,
          role: signupRole,
          roleSpecificId: signupForm.roleSpecificId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed. Please check your details.");
      }

      const registeredName = data.user?.name || signupForm.fullName.trim();
      try {
        localStorage.setItem("attendex_user_name", registeredName);
      } catch {}

      toast.success("Institutional Account Created", {
        description: `Welcome aboard, ${registeredName}! Redirecting to workspace...`
      });

      const redirectPath = 
        signupRole === "STUDENT" ? "/student/dashboard" : "/parent/dashboard";

      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1000);
    } catch (err: any) {
      toast.error("Registration Failed", {
        description: err.message || "Unable to create account. Contact administrator."
      });
      setIsRegistering(false);
    }
  };

  const roleButtons: { id: SignupRole; label: string; icon: any }[] = [
    { id: "STUDENT", label: "Student", icon: User },
    { id: "PARENT", label: "Guardian", icon: Users },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

        {/* Top Header */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-3 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight">Attendex</span>
          </div>
        </div>

        {/* Center Auth Portal */}
        <div className="w-full max-w-[440px] mx-auto my-4 z-10">
          <Card className="p-6 sm:p-8 border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 rounded-3xl space-y-5">
            {/* Dual Tab Switcher: Sign In vs Create Account */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("signin")}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === "signin"
                    ? "bg-white text-slate-900 shadow-sm font-black"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === "signup"
                    ? "bg-white text-slate-900 shadow-sm font-black"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Create Account</span>
              </button>
            </div>

            {/* ═════════════════ SIGN IN TAB ═════════════════ */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="identifier" className="text-xs font-bold text-slate-700">
                    Institutional Email / Roll Number
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. principal@college.edu or CS-101"
                    autoComplete="username"
                    className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 text-sm focus-visible:ring-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                    <Link href="/forgot-password" title="Recover Access" className="text-xs font-semibold text-blue-600 hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 text-sm focus-visible:ring-slate-900 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-950">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Student Sign-In:</span>
                  </div>
                  <p className="text-slate-600 text-[10px] leading-relaxed">
                    Enter your assigned Roll Number (e.g. <code className="bg-white px-1 py-0.5 rounded text-blue-800 font-mono">CS-101</code>) or institutional email and your password.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
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

                {/* Prompt to create account */}
                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-500">
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Create one now
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ═════════════════ CREATE ACCOUNT TAB ═════════════════ */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Security Advisory */}
                <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-snug">
                    <strong>Staff Access:</strong> Faculty and Principal accounts are provisioned exclusively by Institutional Registry. Self-registration is strictly for Students & Guardians.
                  </p>
                </div>

                {/* Role Selector */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Account Type</Label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                    {roleButtons.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSignupRole(r.id);
                          setSignupForm({ ...signupForm, roleSpecificId: "" });
                        }}
                        className={cn(
                          "py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                          signupRole === r.id
                            ? "bg-white text-blue-600 shadow-sm font-black"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <r.icon className="w-3.5 h-3.5" />
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      placeholder={signupRole === "STUDENT" ? "e.g. John Doe" : "e.g. Prof. John Doe"}
                      className="h-10 pl-9 rounded-xl border-slate-200 text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="name@college.edu"
                      autoComplete="email"
                      className="h-10 pl-9 rounded-xl border-slate-200 text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Role-Specific ID */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    {signupRole === "STUDENT" ? "Roll / Register Number" : "Ward's Roll Number"}
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      value={signupForm.roleSpecificId}
                      onChange={(e) => setSignupForm({ ...signupForm, roleSpecificId: e.target.value })}
                      placeholder={signupRole === "STUDENT" ? "e.g. CS-101 or 21CS042" : "e.g. CS-101"}
                      className="h-10 pl-9 rounded-xl border-blue-100 bg-blue-50/20 text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Mobile Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="+91 98450 00000"
                      className="h-10 pl-9 rounded-xl border-slate-200 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="h-10 pl-9 rounded-xl border-slate-200 text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account &amp; Enter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {/* Switch back to Sign In */}
                <div className="pt-1 text-center">
                  <p className="text-xs text-slate-500">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signin")}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Footer: Powered by Brandex Hyperlink */}
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center gap-2 py-3 z-10">
          <PoweredByBrandex variant="footer" />
        </div>
      </div>
    </PageTransition>
  );
}
