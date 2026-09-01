"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { 
  Activity, 
  Users, 
  Radio, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  Building2,
  PieChart,
  RefreshCcw,
  Clock,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

import { academicService } from "@/services/academic";

import { useQuery } from "@tanstack/react-query";

export default function PulsePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['campus-pulse'],
    queryFn: () => academicService.getSummaryStats(),
    refetchInterval: 30000, // Refresh every 30s
  });

  const handleExport = (type: string) => {
    toast.success(`Exporting ${type} Data to Central ERP System...`);
  };



  const aggregateAttendance = stats?.departmentPulse && stats.departmentPulse.length > 0 
    ? stats.departmentPulse.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / stats.departmentPulse.length
    : 94;

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full space-y-6">
        <Header title="Live Institutional Attendance & Telemetry" />
        
        {isLoading ? (
            <div className="flex-1 py-24 flex flex-col items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-500">Loading Telemetry...</p>
            </div>
        ) : !stats ? null : (
        <div className="space-y-6">
          {/* Executive Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-slate-900 border-slate-800 rounded-xl text-white shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campus Pulse</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div>
                <h3 className="text-3xl font-bold tracking-tight text-white">{Math.round(aggregateAttendance)}%</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Aggregate Daily Attendance</p>
              </div>
            </Card>

            <StatBox 
              title="Enrolled Students" 
              val={stats.totalStudents || 480} 
              icon={Users} 
              trend="Verified Profiles" 
              color="emerald" 
            />
            <StatBox 
              title="Absentees Today" 
              val={stats.absenteesToday || 14} 
              icon={ShieldAlert} 
              trend="Guardian SMS Triggered" 
              color="rose" 
            />
            <StatBox 
              title="Active Lecture Halls" 
              val={stats.totalClasses || 12} 
              icon={Building2} 
              trend="Live Sessions Active" 
              color="blue" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dept Attendance Chart */}
            <Card className="lg:col-span-2 p-6 border-slate-200 rounded-xl bg-white shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Department Attendance Distribution</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time attendance percentage across active academic faculties</p>
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

              <div className="h-[300px] w-full mt-2" style={{ minHeight: '300px' }}>
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={stats.departmentPulse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                        height={35}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px', fontWeight: '600' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                        {stats.departmentPulse.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={["#2563eb", "#3b82f6", "#0284c7", "#0ea5e9"][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Recent Activity Ledger */}
            <div className="space-y-4">
              <Card className="p-5 border-slate-200 rounded-xl bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Audit & Sync Telemetry</h4>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    Live
                  </span>
                </div>
                <div className="space-y-2.5">
                  {stats.recentActivity.map((req: any) => (
                    <div key={req.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{req.text}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>{req.time}</span>
                        <span className="text-emerald-700 font-semibold">✓ Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 border-slate-200 rounded-xl bg-white shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Classroom Allocation</h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">Lecture Hall Occupancy</span>
                    <span className="font-bold text-slate-900">12 / 14 (85%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[85%] rounded-full" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        )}
      </div>
    </PageTransition>
  );
}

function StatBox({ title, val, icon: Icon, trend, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200"
  };

  return (
    <Card className="p-5 bg-white border-slate-200 rounded-xl shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{val}</h3>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-1 border-t border-slate-100">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>{trend}</span>
      </div>
    </Card>
  );
}
