"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { ChevronLeft, GraduationCap, BookOpen, Users } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Header({ title = "Overview", showBack = false }: { title?: React.ReactNode, showBack?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<{ name: string, id: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, faculty_id, roll_number')
            .eq('id', user.id)
            .single();

          setUserProfile({
            name: profile?.full_name || user.user_metadata?.full_name || "Faculty Member",
            id: profile?.faculty_id || profile?.roll_number || "FAC-2026"
          });
        } else {
          setUserProfile({
            name: "Demo Evaluator",
            id: "INST-TEST"
          });
        }
      } catch {
        setUserProfile({
          name: "Demo Evaluator",
          id: "INST-TEST"
        });
      }
    };
    fetchUser();
  }, []);

  const isStudent = pathname?.startsWith('/student');
  const isParent = pathname?.startsWith('/parent');
  const isFaculty = !isStudent && !isParent;

  return (
    <header className="pt-[env(safe-area-inset-top)] md:pt-0 h-auto md:h-16 px-4 md:px-8 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3 py-3 md:py-0">
        {showBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="p-2 h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <h1 className="text-base md:text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* Quick Portal Switcher for Demo */}
        <div className="hidden lg:flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
          <Link
            href="/dashboard"
            className={cn(
              "px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all",
              isFaculty ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Faculty</span>
          </Link>
          <Link
            href="/student/dashboard"
            className={cn(
              "px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all",
              isStudent ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Student</span>
          </Link>
          <Link
            href="/parent/dashboard"
            className={cn(
              "px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all",
              isParent ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Parent</span>
          </Link>
        </div>

        <div className="text-xs font-semibold text-slate-500 hidden sm:block">
          {format(new Date(), "EEE, MMM d, yyyy")}
        </div>

        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 md:pl-5">
          <Avatar className="h-8 w-8 border border-slate-200">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || 'User'}`} alt="User" />
            <AvatarFallback>{userProfile?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">{userProfile?.name || "Demo User"}</span>
            <span className="text-[10px] text-slate-500 leading-tight">{userProfile?.id || "ID: Verified"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
