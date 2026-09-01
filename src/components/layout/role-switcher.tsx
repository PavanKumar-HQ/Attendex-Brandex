"use client";

import { useAuth, CoreRole, PRESET_USERS } from "@/lib/auth-context";
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  UserCheck, 
  ChevronDown,
  Sparkles
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<CoreRole, any> = {
  ADMIN: ShieldCheck,
  TEACHER: UserCheck,
  STUDENT: GraduationCap,
  PARENT: Users
};

const ROLE_COLORS: Record<CoreRole, { bg: string; text: string; border: string; badge: string }> = {
  ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-600" },
  TEACHER: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-600" },
  STUDENT: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-600" },
  PARENT: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-600" }
};

export function RoleSwitcher() {
  const { role, currentUser, switchRole } = useAuth();
  const Icon = ROLE_ICONS[role] || UserCheck;
  const colors = ROLE_COLORS[role] || ROLE_COLORS.TEACHER;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer",
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", colors.badge)} />
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline font-bold">{currentUser.name}</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/80 border border-current font-bold uppercase">
          {role}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-slate-200 bg-white">
        <div className="px-3 py-2 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Switch Active Role Context
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Test cross-portal workflows in real time</p>
        </div>

        <div className="p-1 space-y-1 mt-1">
          {(Object.keys(PRESET_USERS) as CoreRole[]).map((r) => {
            const user = PRESET_USERS[r];
            const RIcon = ROLE_ICONS[r];
            const isCurrent = r === role;
            const rColors = ROLE_COLORS[r];

            return (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all",
                  isCurrent
                    ? "bg-slate-900 text-white font-bold shadow-xs"
                    : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                    isCurrent ? "bg-white/20 text-white" : `${rColors.bg} ${rColors.text}`
                  )}>
                    <RIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold leading-tight">{user.name}</p>
                    <p className={cn("text-[10px]", isCurrent ? "text-slate-300" : "text-slate-400")}>
                      {user.roleLabel}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
