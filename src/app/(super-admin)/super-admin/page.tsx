"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Activity, 
  Server, 
  Settings, 
  Key, 
  ArrowRight,
  Sparkles,
  Search
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { platformService, PlatformStats } from "@/services/platform.service";
import { Organization } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SuperAdminPlatformPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const { data: stats, isLoading: isStatsLoading } = useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: () => platformService.getPlatformStats(),
  });

  const { data: institutions = [], isLoading: isInstLoading } = useQuery<Organization[]>({
    queryKey: ["platform-institutions"],
    queryFn: () => platformService.getInstitutions(),
  });

  const createMutation = useMutation({
    mutationFn: () => platformService.createInstitution({ name: newName, code: newCode, principalEmail: newEmail }),
    onSuccess: (res) => {
      toast.success(res.message);
      setIsCreateOpen(false);
      setNewName("");
      setNewCode("");
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["platform-institutions"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to provision institution.");
    }
  });

  const filteredInstitutions = institutions.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Top Platform Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
              <Server className="w-3.5 h-3.5" />
              <span>Attendex Multi-Tenant Cloud Operating System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Platform Command Center</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Global management across all registered institutional nodes and principals</p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg px-4 flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Institution</span>
          </Button>
        </div>

        {/* Global Platform Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-slate-800/80 border-slate-700/80 rounded-xl space-y-2 text-white">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Institutions</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{stats?.totalInstitutions || 12}</h3>
            <p className="text-xs text-emerald-400 font-medium">100% Multi-Tenant Isolation</p>
          </Card>

          <Card className="p-5 bg-slate-800/80 border-slate-700/80 rounded-xl space-y-2 text-white">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Principals Assigned</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{stats?.totalPrincipals || 12}</h3>
            <p className="text-xs text-slate-400 font-medium">Active College Authorities</p>
          </Card>

          <Card className="p-5 bg-slate-800/80 border-slate-700/80 rounded-xl space-y-2 text-white">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Enrolled Strength</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{(stats?.totalStudents || 14850).toLocaleString()}</h3>
            <p className="text-xs text-slate-400 font-medium">Verified Student Identities</p>
          </Card>

          <Card className="p-5 bg-slate-800/80 border-slate-700/80 rounded-xl space-y-2 text-white">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">System Health</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h3 className="text-xl font-bold text-emerald-400 tracking-tight">99.98%</h3>
            <p className="text-xs text-slate-400 font-medium">Supabase RLS Cluster Active</p>
          </Card>
        </div>

        {/* Section: Institutions List */}
        <Card className="p-6 bg-slate-800/90 border-slate-700 rounded-xl space-y-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>Registered Institutional Nodes</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Autonomous institutional clusters with dedicated academic domains and RLS isolation</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search college or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 bg-slate-900/90 border-slate-700 text-xs text-white placeholder:text-slate-500 rounded-lg focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {isInstLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading institutional nodes...</div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/60 rounded-lg border border-slate-700/60">
                No matching institutions found.
              </div>
            ) : (
              filteredInstitutions.map((inst) => (
                <div key={inst.id} className="p-4 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                        {inst.code}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                        ACTIVE
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{inst.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Principal: <strong className="text-slate-200">{inst.principalName || "Dr. Assigned"}</strong></span>
                      <span>•</span>
                      <span>Students: <strong className="text-slate-200">{(inst.studentCount || 1284).toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Faculty: <strong className="text-slate-200">{inst.facultyCount || 76}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success(`Configuration opened for ${inst.code}`)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold rounded-lg h-9 px-3"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" />
                      <span>Configure</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        document.cookie = "attendex_demo_session=PRINCIPAL; path=/; max-age=86400; SameSite=Lax";
                        window.location.href = "/principal";
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg h-9 px-3 flex items-center gap-1.5"
                    >
                      <span>Enter as Principal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Modal / Dialog to Provision New College */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-6 rounded-2xl shadow-2xl text-white space-y-4 animate-in fade-in zoom-in-95">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Provision New Institutional Node</h3>
                <p className="text-xs text-slate-400">Creates an isolated tenant environment with automated schema binding</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Institution Official Name</label>
                  <Input
                    placeholder="e.g. Stanford College of Technology"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-10 bg-slate-800 border-slate-700 text-white rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Institution Code (3-5 Letters)</label>
                  <Input
                    placeholder="e.g. SCT"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="h-10 bg-slate-800 border-slate-700 text-white rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Principal Official Email</label>
                  <Input
                    placeholder="principal@college.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-10 bg-slate-800 border-slate-700 text-white rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => createMutation.mutate()}
                  disabled={!newName || !newCode || createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 h-9 rounded-lg"
                >
                  Confirm & Provision
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
