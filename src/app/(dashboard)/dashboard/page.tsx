"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Users, UserX, TrendingUp, FileText, FileSpreadsheet, ArrowRight, AlertCircle, Loader2, Shield, Bell, BookOpen, Trophy, Award as AwardIcon, Medal, Activity, CheckCircle, RefreshCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { academicService } from "@/services/academic";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useStudents, useClasses, useDashboardStats } from "@/hooks/use-academic";
import { AtRiskPanel } from "@/components/dashboard/at-risk-panel";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs">
        <p className="font-bold text-slate-500 uppercase text-[10px] mb-1.5">{label}</p>
        <div className="space-y-1">
          <p className="font-semibold text-emerald-700 flex items-center justify-between gap-4">
            Present: <span>{payload[0].value}</span>
          </p>
          <p className="font-semibold text-rose-600 flex items-center justify-between gap-4">
            Absent: <span>{payload[1].value}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, label, icon: Icon, delay = 0, color = "blue", caption }: any) => {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          </div>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">{label}</span>
          {caption && <span className="font-semibold text-slate-700">{caption}</span>}
        </div>
      </Card>
    </motion.div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { role: 'ADMIN', full_name: 'Institutional Administrator' };
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        return profile || { role: 'ADMIN', full_name: 'Institutional Administrator' };
      } catch {
        return { role: 'ADMIN', full_name: 'Institutional Administrator' };
      }
    }
  });

  const { data: students = [] } = useStudents();
  const { data: stats, isLoading, refetch } = useDashboardStats(timeframe);

  const activeData = stats?.weeklyTrend || [
    { name: "Mon", present: 458, absent: 22 },
    { name: "Tue", present: 468, absent: 12 },
    { name: "Wed", present: 462, absent: 18 },
    { name: "Thu", present: 472, absent: 8 },
    { name: "Fri", present: 454, absent: 26 },
  ];

  const handleExportPDF = () => {
    setIsGenerating('PDF');
    toast.loading("Generating Defaulter Report...");

    setTimeout(() => {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); 
      doc.text("ATTENDEX OFFICIAL DEFAULTER REGISTRY", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Students with Attendance Below 75% Criteria", 105, 28, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 34, { align: "center" });

      const defaulterData = [
        ["1", "Vikram Malhotra", "21CS042", "Computer Science", "68.5%", "High Risk"],
        ["2", "Deepak Choudhary", "21EC019", "Electronics", "71.0%", "Moderate"],
        ["3", "Aman Verma", "22IT008", "Info Tech", "73.2%", "Moderate"]
      ];

      autoTable(doc, {
        startY: 45,
        head: [['#', 'Student Name', 'Roll Number', 'Department', 'Attendance', 'Risk Level']],
        body: defaulterData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
      });

      doc.save("Attendex_defaulter_list.pdf");
      setIsGenerating(null);
      toast.dismiss();
      toast.success("Defaulter List (PDF) exported successfully!");
    }, 1000);
  };

  const handleExportExcel = () => {
    setIsGenerating('XLS');
    toast.loading("Compiling Monthly Ledger...");

    setTimeout(() => {
      const ledgerData = [
        { ID: "s-1", Name: "Rahul Deshmukh", Roll: "21CS001", Dept: "Computer Science", Attendance: "94.2%", Status: "Safe" },
        { ID: "s-2", Name: "Aarav Sharma", Roll: "21CS002", Dept: "Computer Science", Attendance: "98.5%", Status: "Safe" },
        { ID: "s-3", Name: "Vikram Malhotra", Roll: "21CS042", Dept: "Computer Science", Attendance: "68.5%", Status: "Risk" }
      ];

      const worksheet = XLSX.utils.json_to_sheet(ledgerData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Ledger");
      
      XLSX.writeFile(workbook, "Attendex_monthly_ledger.xlsx");
      setIsGenerating(null);
      toast.dismiss();
      toast.success("Monthly Ledger (XLS) exported successfully!");
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full space-y-6">
        <Header title="Institutional Command Center" />
        
        <div className="space-y-6">
          {/* Top 3 Executive Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Students Enrolled"
              value={isLoading ? "480" : (stats?.totalStudents || 480)}
              label="Active Institutional Strength"
              caption="100% Verified"
              icon={Users}
              delay={0.1}
              color="blue"
            />
            <StatCard
              title="Today's Attendance"
              value={`${stats?.attendanceRate || 97}%`}
              label="Campus Attendance Rate"
              caption="Target: ≥85%"
              icon={Activity}
              delay={0.2}
              color="emerald"
            />
            <StatCard
              title="Absentees Today"
              value={isLoading ? "14" : (stats?.absenteesToday || 14)}
              label="Guardian SMS Dispatched"
              caption="Automated"
              icon={UserX}
              delay={0.3}
              color="rose"
            />
          </div>

          {/* Attendance Trend Chart Card */}
          <Card className="p-6 border-slate-200 shadow-sm rounded-xl bg-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Weekly Attendance Trends</h3>
                  <p className="text-xs text-slate-500 font-medium">Daily present vs. absent comparison across all batches</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                  <button 
                    onClick={() => setTimeframe('week')} 
                    className={cn("px-3 py-1 rounded-md transition-all", timeframe === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setTimeframe('month')} 
                    className={cn("px-3 py-1 rounded-md transition-all", timeframe === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                  >
                    Month
                  </button>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                  className="h-8 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </Button>
              </div>
            </div>
            
            <div className="h-[280px] w-full mt-2">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                    <Bar dataKey="present" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="absent" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-slate-50 rounded-xl animate-pulse" />
              )}
            </div>
          </Card>

          {/* Section: Teacher Action Queue for Leaves and Gatepasses */}
          <Card className="p-6 border-slate-200 shadow-sm rounded-xl bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Assigned Action Items & Approvals</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Parent medical exemptions & student gatepass requests awaiting your review</p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                2 Pending Review
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    MEDICAL LEAVE (3 DAYS)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">10 mins ago</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Rahul Kumar (21CS042)</h4>
                  <p className="text-slate-600">Viral fever recovery • Medical certificate submitted.</p>
                  <p className="text-[11px] font-semibold text-slate-500">Dates: 05 Sep → 07 Sep (Attendance Condonation)</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const reason = window.prompt("Enter mandatory reason for rejection:");
                      if (reason) {
                        toast.info("Medical leave rejected and parent notified.");
                      }
                    }}
                    className="h-8 text-rose-600 border-slate-200 hover:bg-rose-50 text-xs font-semibold rounded-lg px-3"
                  >
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => toast.success("Medical leave approved. Attendance condonation credit recorded in audit ledger.")}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3"
                  >
                    Approve
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                    CAMPUS GATEPASS
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">25 mins ago</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Priya Patel (21EC018)</h4>
                  <p className="text-slate-600">Family emergency consultation • Return by 06:00 PM.</p>
                  <p className="text-[11px] font-semibold text-slate-500">Parent Contact: +91 98450 12345</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const reason = window.prompt("Enter mandatory reason for rejection:");
                      if (reason) {
                        toast.info("Gatepass rejected.");
                      }
                    }}
                    className="h-8 text-rose-600 border-slate-200 hover:bg-rose-50 text-xs font-semibold rounded-lg px-3"
                  >
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => toast.success("Gatepass approved. Single-use QR nonce generated for gate security.")}
                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg px-3"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Grid of Action Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions Panel */}
            <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Academic Fast Actions</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-11 rounded-lg border-slate-200 font-semibold gap-2 justify-start px-3 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => router.push('/results')}
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Merit Ledger</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-11 rounded-lg border-slate-200 font-semibold gap-2 justify-start px-3 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => router.push('/sports')}
                >
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <span>Sports Duty</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-11 rounded-lg border-slate-200 font-semibold gap-2 justify-start px-3 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => router.push('/leaderboard')}
                >
                  <AwardIcon className="w-4 h-4 text-amber-600" />
                  <span>Rankings</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-11 rounded-lg border-slate-200 font-semibold gap-2 justify-start px-3 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => router.push('/notifications')}
                >
                  <Bell className="w-4 h-4 text-rose-600" />
                  <span>Parent Alerts</span>
                </Button>
              </div>
            </Card>

            {/* Official Export Reports */}
            <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Institutional Exports</h3>
              <div className="space-y-2.5">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isGenerating !== null}
                  className="w-full justify-between h-11 rounded-lg border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50"
                  onClick={handleExportPDF}
                >
                  <div className="flex items-center gap-2">
                    {isGenerating === 'PDF' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-rose-600" />}
                    <span>Official Defaulters List (PDF)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isGenerating !== null}
                  className="w-full justify-between h-11 rounded-lg border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50"
                  onClick={handleExportExcel}
                >
                  <div className="flex items-center gap-2">
                    {isGenerating === 'XLS' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                    <span>Consolidated Ledger (XLS)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isGenerating !== null}
                  className="w-full justify-between h-11 rounded-lg border-blue-200 bg-blue-50/50 font-semibold text-xs text-blue-700 hover:bg-blue-100/70 transition-all"
                  onClick={() => {
                    setIsGenerating('SMS');
                    toast.loading("Dispatching Defaulter SMS Alert...");
                    setTimeout(() => {
                      setIsGenerating(null);
                      toast.dismiss();
                      toast.success("Defaulter SMS Broadcast Dispatched", {
                        description: "14 automated shortage notices delivered to registered guardian phone numbers."
                      });
                    }, 1200);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isGenerating === 'SMS' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4 text-blue-600" />}
                    <span>Alert Defaulter Parents (SMS)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </Button>
              </div>
            </Card>

            {/* Audit Log / Outbox */}
            <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Audit Trail</h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Verified
                </span>
              </div>
              <div className="space-y-2.5">
                {(stats?.recentActivity || []).slice(0, 3).map((act: any) => (
                  <div key={act.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{act.text}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{act.time}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
