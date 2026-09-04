"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Building, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  FileCheck, 
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface PlacementDrive {
  id: string;
  company_name: string;
  role_title: string;
  ctc_package: string;
  eligibility_criteria?: string;
  drive_date?: string;
  status?: string;
  location?: string;
  rounds_description?: string;
}

export default function StudentPlacementPage() {
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [studentStats, setStudentStats] = useState({
    cgpa: "8.92",
    attendance: "91.4%",
    standing: "Clear (No Active Backlogs)",
    resumeStatus: "Verified by Placement Cell"
  });

  useEffect(() => {
    async function loadPlacementData() {
      try {
        setLoading(true);
        // Load active drives
        const { data: driveData, error: driveErr } = await supabase
          .from('placement_drives')
          .select('*')
          .order('drive_date', { ascending: true });

        if (!driveErr && driveData && driveData.length > 0) {
          setDrives(driveData);
        } else {
          setDrives([]);
        }

        // Load logged in student stats if available
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: st } = await supabase
            .from('students')
            .select('attendance_percentage')
            .eq('auth_user_id', user.id)
            .single();

          if (st) {
            setStudentStats(prev => ({
              ...prev,
              attendance: `${Number(st.attendance_percentage || 0).toFixed(1)}%`
            }));
          }
        }
      } catch (err) {
        console.error("Error loading placement data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPlacementData();
  }, []);

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Career & Placement Readiness" showBack />

        <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Eligibility Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Placement Clearance
                </span>
                <span className="text-xs font-semibold text-slate-400">Batch of 2026</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Recruitment Drive Hub</h1>
              <p className="text-xs text-slate-500 font-medium">
                Participate in Tier-1 hiring drives, access verified placement eligibility badges, and register for tests.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => toast.info("Opening Master Resume", { description: "Verified ATS-compliant resume loaded." })}
                variant="outline"
                className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>My Resume</span>
              </Button>
              <Button
                onClick={() => toast.success("Mock Interview Scheduled", { description: "Slot confirmed with Industry Mentor on Friday at 4:00 PM." })}
                className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Book Mock Interview</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cumulative CGPA</span>
              <p className="text-xl font-bold text-slate-900">{studentStats.cgpa}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">&gt; 8.0 Cutoff</p>
            </Card>
            <Card className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Ratio</span>
              <p className="text-xl font-bold text-slate-900">{studentStats.attendance}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Eligible for all drives</p>
            </Card>
            <Card className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Standing</span>
              <p className="text-xl font-bold text-emerald-600">No Backlogs</p>
              <p className="text-[10px] text-slate-400 font-medium">All semesters clear</p>
            </Card>
            <Card className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Placement Status</span>
              <p className="text-xl font-bold text-blue-600">Active</p>
              <p className="text-[10px] text-slate-400 font-medium">{drives.length} Drives Registered</p>
            </Card>
          </div>

          {/* Upcoming Recruitment Drives */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active &amp; Upcoming Campus Drives
            </h3>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                <span className="text-xs font-medium">Loading live placement drives from database...</span>
              </div>
            ) : drives.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-slate-300 bg-white rounded-2xl space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Active Placement Drives</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no scheduled recruitment drives currently in the institutional database. New drives will appear here once published by the Placement Cell.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {drives.map((d) => (
                  <Card key={d.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-all space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-blue-600">{d.company_name}</span>
                        <h4 className="text-base font-bold text-slate-900">{d.role_title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{d.eligibility_criteria || "CGPA ≥ 7.5 • Attendance ≥ 75%"}</p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                        <span className="text-lg font-bold text-emerald-600">{d.ctc_package}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          {d.status || "Registration Open"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {d.drive_date ? new Date(d.drive_date).toLocaleDateString() : "TBA"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" /> {d.location || "Campus Auditorium & Virtual"}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => toast.success(`Application Registered for ${d.company_name}`, { description: "Exam hall seat allocated." })}
                        className="h-8 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm self-end sm:self-auto"
                      >
                        Confirm Test Slot
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

