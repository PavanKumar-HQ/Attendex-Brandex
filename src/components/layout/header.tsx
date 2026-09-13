"use client";

import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { UserMenu } from "@/components/layout/user-menu";

export function Header({ title = "Overview", showBack = false }: { title?: React.ReactNode, showBack?: boolean }) {
  const router = useRouter();

  return (
    <header className="w-full max-w-full overflow-x-hidden pt-[env(safe-area-inset-top)] md:pt-0 min-h-14 md:h-16 px-3 sm:px-4 md:px-8 flex items-center justify-between gap-2.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-3 py-2 md:py-0 min-w-0 flex-1 overflow-hidden">
        {showBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="p-1.5 sm:p-2 h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base md:text-xl font-bold text-slate-900 tracking-tight leading-snug truncate">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
        {/* 4-Role Unified Switcher */}
        <RoleSwitcher />

        <div className="text-xs font-semibold text-slate-400 hidden lg:block">
          {format(new Date(), "EEE, MMM d, yyyy")}
        </div>

        <div className="border-l border-slate-200 pl-2 sm:pl-3 md:pl-4 shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
