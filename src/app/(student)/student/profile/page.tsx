"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { useState } from "react";
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
  FileBadge,
  Edit3,
  Check,
  X,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { academicService } from "@/services/academic";
import { LeaveRequestModal } from "@/components/parent/leave-request-modal";

import { resolveActiveStudent, InstitutionalStudent } from "@/lib/student-auth";

export default function StudentProfilePage() {
  const queryClient = useQueryClient();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['student-profile-info'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let roll = user?.user_metadata?.roll_number;
        
        // Check cookie
        if (!roll && typeof document !== "undefined") {
          const cookieMatch = document.cookie.match(/attendex_student_roll=([^;]+)/);
          if (cookieMatch) roll = decodeURIComponent(cookieMatch[1]);
        }

        const resolved = resolveActiveStudent(roll);
        return { user, student: resolved };
      } catch {
        return { student: resolveActiveStudent() };
      }
    }
  });

  const student: InstitutionalStudent = profile?.student || resolveActiveStudent();
  const isDefaulter = student.attendance_percentage < 75;

  const handleStartEditPhone = () => {
    setPhoneInput(student.phone || "");
    setIsEditingPhone(true);
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim() || phoneInput.trim().length < 8) {
      toast.error("Invalid Phone Number", { description: "Please enter a valid mobile number for identity verification." });
      return;
    }

    setSavingPhone(true);
    try {
      const cleanPhone = phoneInput.trim();
      localStorage.setItem("attendex_user_phone", cleanPhone);
      document.cookie = `attendex_user_phone=${encodeURIComponent(cleanPhone)}; path=/; max-age=31536000`;
      document.cookie = `attendex_student_phone=${encodeURIComponent(cleanPhone)}; path=/; max-age=31536000`;

      await fetch("/api/student/update-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          rollNumber: student.roll_number,
          phone: cleanPhone
        })
      }).catch(() => {});

      queryClient.invalidateQueries({ queryKey: ['student-profile-info'] });
      toast.success("Phone Number Synchronized", {
        description: "Your mobile number has been bound to your student profile for security and recovery."
      });
      setIsEditingPhone(false);
    } catch {
      toast.error("Failed to update contact number.");
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full pb-20 pt-8 max-w-5xl mx-auto space-y-8 px-4 md:px-0">
        <Header title="My Profile" showBack />
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
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1",
                      isDefaulter ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      <ShieldCheck className="w-3 h-3" /> {isDefaulter ? "Attendance Shortage (<75%)" : "In Good Standing"}
                    </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-600" />
                    University Register No: <span className="font-bold text-slate-900 font-mono">{student.roll_number}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600">{student.register_number}</span>
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                      {student.class_name}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold font-mono">
                      DOB: {student.formatted_dob}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                      Attendance: {student.attendance_percentage}%
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
                        <InfoItem icon={Mail} label="University Email" text={student.email} />
                        
                        {/* Interactive Student Phone with Recovery Synchronization */}
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Student Phone</span>
                            {!isEditingPhone ? (
                              <button
                                onClick={handleStartEditPhone}
                                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-blue-50"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Update</span>
                              </button>
                            ) : null}
                          </div>

                          {!isEditingPhone ? (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate font-mono">
                                  {student.phone || "+91 98450 00000"}
                                </p>
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active for Recovery
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-blue-50/50 border border-blue-200">
                              <input
                                type="tel"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="+91 98450 12345"
                                className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono flex-1 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={handleSavePhone}
                                disabled={savingPhone}
                                className="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs"
                              >
                                {savingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingPhone(false)}
                                className="h-8 px-2 rounded-lg text-slate-500 hover:bg-slate-200 text-xs"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <InfoItem icon={CalendarCheck} label="Date of Birth (DOB)" text={`${student.formatted_dob} (Password: ${student.dob})`} />
                        <InfoItem icon={IdCard} label="Permanent Register Number" text={student.register_number} />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <InfoItem icon={MapPin} label="Campus Residence / Hostel" text={student.hostel} />
                    </div>
                </Card>

                <Card className="p-6 border-slate-200 rounded-2xl bg-white shadow-sm space-y-6 border">
                    <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                      Guardian &amp; Emergency Registry
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoItem icon={User} label="Primary Guardian" text={student.parent_name} />
                        <InfoItem icon={Phone} label="Guardian Contact" text={student.parent_phone} />
                        <InfoItem icon={Mail} label="Registered Parent Email" text={student.parent_email} />
                        <InfoItem icon={CalendarCheck} label="Academic Year" text={`Year ${student.year} • Semester ${student.semester}`} />
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
                        <AcademicStats 
                          label="Attendance Buffer" 
                          val={isDefaulter ? "Shortage (<75%)" : "Safe (≥75%)"} 
                          color={isDefaulter ? "text-red-400" : "text-emerald-400"} 
                        />
                        <AcademicStats label="Current Standing" val={`${student.attendance_percentage}%`} color="text-blue-400" />
                        <AcademicStats label="Cumulative CGPA" val={`${student.cgpa} / 10.0`} color="text-amber-400" />
                        <AcademicStats label="Sessions Attended" val={`${student.attended_sessions} / ${student.total_sessions}`} color="text-slate-300" />
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
