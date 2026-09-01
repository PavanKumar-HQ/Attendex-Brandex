"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  IdCard,
  Camera,
  GraduationCap,
  Building2,
  CalendarCheck,
  ShieldCheck,
  KeyRound,
  FileBadge
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { academicService } from "@/services/academic";
import { LeaveRequestModal } from "@/components/parent/leave-request-modal";

export default function StudentProfilePage() {
  const { data: profile } = useQuery({
    queryKey: ['student-profile-info'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const student = await academicService.getStudentByRoll(user.user_metadata?.roll_number || "21CS042");
        return { user, student };
      } catch {
        return null;
      }
    }
  });

  const student = profile?.student || {
    name: "Rahul Deshmukh",
    roll_number: "21CS042",
    classes: { name: "B.Tech Computer Science (4A)" },
    phone: "+91 98451 23091",
    parent_email: "parent.rahul@example.com"
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full pb-20 pt-8 max-w-5xl mx-auto space-y-8 px-4 md:px-0">
        
        {/* Profile Header */}
        <section className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold border-2 border-slate-100 shadow-md">
                    {student.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <button 
                  onClick={() => toast.info("Profile Photo Upload", { description: "Institutional photo sync is managed by Department Admin." })}
                  className="absolute bottom-1 right-1 p-1.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all"
                >
                    <Camera className="w-3.5 h-3.5" />
                </button>
            </div>
            
            <div className="text-center sm:text-left space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{student.name}</h1>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Enrolled
                    </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-600" />
                    University Reg: <span className="font-bold text-slate-900">{student.roll_number}</span>
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                      {student.classes?.name || "B.Tech Computer Science"}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      Academic Year 2026
                    </span>
                </div>
            </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Personal info */}
            <div className="md:col-span-2 space-y-6">
                <Card className="p-6 border-slate-200 rounded-2xl bg-white shadow-sm space-y-6 border">
                    <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                      Institutional Identity &amp; Contact
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoItem icon={Mail} label="University Email" text="rahul.deshmukh@kletech.ac.in" />
                        <InfoItem icon={Phone} label="Student Phone" text={student.phone || "+91 98451 23091"} />
                        <InfoItem icon={CalendarCheck} label="Date of Admission" text="Aug 18, 2023" />
                        <InfoItem icon={IdCard} label="VTU / Institutional ID" text={`KLE-${student.roll_number}`} />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <InfoItem icon={MapPin} label="Campus Residence / Address" text="Hostel Block 4, KLE Technological University, Vidyanagar, Hubballi" />
                    </div>
                </Card>

                <Card className="p-6 border-slate-200 rounded-2xl bg-white shadow-sm space-y-6 border">
                    <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                      Guardian &amp; Emergency Registry
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoItem icon={User} label="Primary Guardian" text="Suresh Deshmukh (Father)" />
                        <InfoItem icon={Mail} label="Registered Parent Email" text={student.parent_email || "parent.rahul@example.com"} />
                    </div>
                </Card>
            </div>

            {/* Right Column: Academic Sidebar */}
            <div className="space-y-6">
                <Card className="p-6 border-none bg-slate-900 rounded-2xl text-white shadow-xl space-y-5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <GraduationCap className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="font-bold text-sm">Academic Standing</span>
                    </div>
                    <div className="space-y-3 divide-y divide-slate-800 text-xs">
                        <AcademicStats label="Attendance Buffer" val="Safe (≥75%)" color="text-emerald-400" />
                        <AcademicStats label="Evaluation Status" val="In Good Standing" color="text-blue-400" />
                        <AcademicStats label="Academic Backlogs" val="0 Active" color="text-slate-300" />
                        <AcademicStats label="Institutional Sports XP" val="450 XP" color="text-amber-400" />
                    </div>
                </Card>

                <Card className="p-6 border-slate-200 rounded-2xl bg-white shadow-sm space-y-4 border">
                    <h4 className="font-bold text-sm text-slate-900">Student Services</h4>
                    <div className="space-y-2">
                         <Button 
                           variant="outline" 
                           onClick={() => toast.success("Password Reset Link Dispatched", { description: "Check your university email for verification code." })}
                           className="w-full justify-start h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-2"
                         >
                           <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                           <span>Reset University Password</span>
                         </Button>

                         <Button 
                           variant="outline" 
                           onClick={() => toast.info("ID Card Reissue Request Queued", { description: "Token #ID-8821 generated for Registrar Office." })}
                           className="w-full justify-start h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-2"
                         >
                           <FileBadge className="w-3.5 h-3.5 text-blue-600" />
                           <span>Request Digital ID Card</span>
                         </Button>

                         <LeaveRequestModal 
                           studentName={student.name} 
                           studentRoll={student.roll_number}
                           triggerButton={
                             <Button 
                               variant="outline" 
                               className="w-full justify-start h-10 rounded-xl border-rose-100 bg-rose-50/50 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 gap-2"
                             >
                               <span>Apply for Student Leave / OD</span>
                             </Button>
                           }
                         />
                    </div>
                </Card>
            </div>
        </div>

      </div>
    </PageTransition>
  );
}

function InfoItem({ icon: Icon, label, text }: any) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {label}
            </p>
            <p className="text-xs font-semibold text-slate-800">{text}</p>
        </div>
    )
}

function AcademicStats({ label, val, color }: any) {
    return (
        <div className="flex justify-between items-center pt-2.5 first:pt-0">
            <span className="text-slate-400 font-medium">{label}</span>
            <span className={cn("font-bold tracking-wide", color)}>{val}</span>
        </div>
    )
}
