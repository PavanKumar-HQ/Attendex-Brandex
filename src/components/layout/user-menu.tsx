"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Settings, 
  Bell, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  UserCheck,
  Building2,
  ExternalLink
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, CoreRole } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<CoreRole, any> = {
  ADMIN: ShieldCheck,
  TEACHER: UserCheck,
  STUDENT: GraduationCap,
  PARENT: Users
};

const ROLE_BADGE_STYLES: Record<CoreRole, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  TEACHER: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  STUDENT: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  PARENT: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }
};

export function UserMenu() {
  const router = useRouter();
  const { currentUser, role } = useAuth();
  const [open, setOpen] = React.useState(false);

  const roleStyle = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.TEACHER;
  const RoleIcon = ROLE_ICONS[role] || UserCheck;

  const handleSignOut = async () => {
    try {
      document.cookie = "attendex_demo_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    toast.success("Signed out successfully");
    setOpen(false);
    window.location.href = "/login";
  };

  const profilePath = role === "STUDENT" 
    ? "/student/profile" 
    : role === "PARENT"
    ? "/parent/dashboard"
    : "/settings";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-2 sm:gap-2.5 p-1 -m-1 sm:p-1.5 sm:-m-1.5 rounded-xl transition-all cursor-pointer outline-none group border border-transparent",
          "hover:bg-slate-100 hover:border-slate-200/80 focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:border-slate-300",
          open && "bg-slate-100 border-slate-200/90 shadow-2xs"
        )}
        aria-label={`Open account menu for ${currentUser.name}`}
      >
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8 border border-slate-200 shrink-0 ring-2 ring-transparent group-hover:ring-slate-300/60 transition-all">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`} 
              alt={currentUser.name} 
            />
            <AvatarFallback className="text-[11px] font-bold bg-slate-900 text-white">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="hidden md:flex flex-col text-left min-w-0 max-w-[140px]">
          <span className="text-xs font-bold text-slate-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-slate-500 leading-tight truncate font-medium">
            {currentUser.roleLabel}
          </span>
        </div>

        <ChevronDown 
          className={cn(
            "w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 hidden sm:block shrink-0",
            open && "rotate-180 text-slate-900"
          )} 
        />
      </PopoverTrigger>

      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="w-80 p-0 rounded-2xl shadow-xl border-slate-200 bg-white overflow-hidden text-slate-800"
      >
        {/* User Identity Header Card */}
        <div className="p-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-slate-200 shrink-0">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`} 
                alt={currentUser.name} 
              />
              <AvatarFallback className="text-sm font-bold bg-slate-900 text-white">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</h4>
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border shrink-0",
                  roleStyle.bg,
                  roleStyle.text,
                  roleStyle.border
                )}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser.email}</p>
              
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.institutionName || "Global Institute of Tech"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Account Navigation */}
        <div className="p-2 space-y-0.5 border-b border-slate-100 text-xs">
          <Link
            href={profilePath}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>Personal Profile</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </Link>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>System & Security Settings</span>
            </div>
          </Link>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-slate-400" />
              <span>Notifications & Alerts</span>
            </div>
          </Link>
        </div>

        {/* Institutional Active Session Status */}
        <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span className="font-semibold">Verified Active Session</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
            {role}
          </span>
        </div>

        {/* Sign Out Action */}
        <div className="p-2 bg-slate-50/30">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out of Attendex</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">End session</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
