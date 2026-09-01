"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { useAuth } from "@/lib/auth-context";

export function Header({ title = "Overview", showBack = false }: { title?: React.ReactNode, showBack?: boolean }) {
  const router = useRouter();
  const { currentUser } = useAuth();

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

      <div className="flex items-center gap-3 md:gap-4">
        {/* 4-Role Unified Switcher */}
        <RoleSwitcher />

        <div className="text-xs font-semibold text-slate-400 hidden lg:block">
          {format(new Date(), "EEE, MMM d, yyyy")}
        </div>

        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 md:pl-4">
          <Avatar className="h-8 w-8 border border-slate-200">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`} alt={currentUser.name} />
            <AvatarFallback>{currentUser.avatar}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</span>
            <span className="text-[10px] text-slate-500 leading-tight">{currentUser.roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
