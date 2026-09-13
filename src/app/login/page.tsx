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
type SignupRole = "TEACHER" | "STUDENT" | "PRINCIPAL" | "ADMIN" | "PARENT";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");

  // Sign In state
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up state
  const [isRegistering, setIsRegistering] = useState(false);
  const [signupRole, setSignupRole] = useState<SignupRole>("TEACHER");
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleSpecificId: ""
  });

  // Credential helper state
  const [showDobHelper, setShowDobHelper] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);

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

      toast.success("Authentication Verified", {
        description: `Welcome back, ${staffJson.user?.name || "User"}! Redirecting to workspace...`
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
          role: signupRole === "ADMIN" ? "SUPER_ADMIN" : signupRole,
          roleSpecificId: signupForm.roleSpecificId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed. Please check your details.");
      }

      toast.success("Institutional Account Created", {
        description: `Welcome aboard, ${data.user?.name || signupForm.fullName}! Redirecting to workspace...`
      });

      const redirectPath = 
        signupRole === "ADMIN" ? "/super-admin" :
        signupRole === "PRINCIPAL" ? "/principal" :
        signupRole === "TEACHER" ? "/dashboard" :
        signupRole === "STUDENT" ? "/student/dashboard" :
        signupRole === "PARENT" ? "/parent/dashboard" : "/dashboard";

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
    { id: "TEACHER", label: "Faculty", icon: GraduationCap },
    { id: "STUDENT", label: "Student", icon: User },
    { id: "PRINCIPAL", label: "Principal", icon: Building2 },
    { id: "ADMIN", label: "Admin", icon: Crown },
    { id: "PARENT", label: "Guardian", icon: Users },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

        {/* Top Header */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2 z-10">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <span>Attendex <span className="text-xs font-semibold text-slate-500">Academic Operating System</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-Tenant Institutional Cloud</span>
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
                  <div className="font-bold flex items-center justify-between text-blue-950">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      Student Sign-In Tip:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDobHelper(true);
                        handleLookup("");
                      }}
                      className="text-blue-700 underline font-semibold hover:text-blue-950 text-[11px]"
                    >
                      Search Roster
                    </button>
                  </div>
                  <p className="text-slate-600 text-[10px] leading-relaxed">
                    Use your Roll Number (e.g. <code className="bg-white px-1 py-0.5 rounded text-blue-800 font-mono">CS-101</code>) and Date of Birth in DDMMYYYY format.
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
                {/* Role Selector */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Select Role</Label>
                  <div className="grid grid-cols-5 p-1 bg-slate-100 rounded-xl gap-1">
                    {roleButtons.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSignupRole(r.id);
                          setSignupForm({ ...signupForm, roleSpecificId: "" });
                        }}
                        className={cn(
                          "py-2 px-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-0.5",
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
                    {signupRole === "TEACHER" ? "Faculty Employee ID" :
                     signupRole === "PRINCIPAL" ? "Principal Admin ID" :
                     signupRole === "ADMIN" ? "Administrator ID" :
                     signupRole === "STUDENT" ? "Roll / Register Number" : "Student's Roll Number"}
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      value={signupForm.roleSpecificId}
                      onChange={(e) => setSignupForm({ ...signupForm, roleSpecificId: e.target.value })}
                      placeholder={
                        signupRole === "TEACHER" ? "e.g. EMP-CS-101" :
                        signupRole === "PRINCIPAL" ? "e.g. PRIN-01" :
                        signupRole === "ADMIN" ? "e.g. ADMIN-01" :
                        signupRole === "STUDENT" ? "e.g. CS-101" : "e.g. CS-101"
                      }
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
                    <h3 className="text-sm font-bold text-slate-900">Student Directory Search</h3>
                    <p className="text-[11px] text-slate-500">Search registered students</p>
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
                  <label className="text-xs font-bold text-slate-700">Search by Name or Roll No:</label>
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => handleLookup(e.target.value)}
                    placeholder="e.g. John, CS-101"
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
                          setIdentifier(s.roll_number);
                          setShowDobHelper(false);
                          toast.info(`Selected ${s.name}`, {
                            description: `Roll No: ${s.roll_number}. Enter your password to sign in.`
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
                          <span>{s.class_name || "Enrolled Student"}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No matching records found. Create an account via the Create Account tab.
                    </div>
                  )}
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

        {/* Footer: Powered by Brandex Hyperlink */}
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center gap-2 py-3 z-10">
          <PoweredByBrandex variant="footer" />
          <p className="text-[11px] text-slate-400 font-medium">
            Attendex OS • Secured with PostgreSQL Row Level Security
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
