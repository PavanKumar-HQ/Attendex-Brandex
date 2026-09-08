"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  QrCode, 
  FileSpreadsheet, 
  Award, 
  UserCircle2, 
  CalendarCheck, 
  ReceiptText, 
  UserCheck2,
  GraduationCap
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  // Don't render on login, landing, or desktop viewports
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const isStudent = pathname.startsWith("/student");
  const isParent = pathname.startsWith("/parent");
  const isFaculty = !isStudent && !isParent;

  const studentTabs = [
    { href: "/student/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/student/gatepass", label: "Gatepass", icon: QrCode },
    { href: "/student/marks", label: "Marks", icon: Award },
    { href: "/student/hall-ticket", label: "Exam Pass", icon: FileSpreadsheet },
    { href: "/student/profile", label: "Profile", icon: UserCircle2 },
  ];

  const parentTabs = [
    { href: "/parent/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/parent/history", label: "Attendance", icon: CalendarCheck },
    { href: "/parent/fees", label: "Fees", icon: ReceiptText },
    { href: "/parent/proctor", label: "Proctor", icon: UserCheck2 },
  ];

  const facultyTabs = [
    { href: "/dashboard", label: "Command", icon: LayoutDashboard },
    { href: "/attendance", label: "Roll-Call", icon: CalendarCheck },
    { href: "/results/manage", label: "Results", icon: Award },
    { href: "/subjects", label: "Subjects", icon: GraduationCap },
  ];

  const tabs = isStudent ? studentTabs : isParent ? parentTabs : facultyTabs;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 touch-manipulation ${
                isActive 
                  ? "text-blue-600 font-semibold scale-105" 
                  : "text-slate-500 hover:text-slate-900 active:scale-95"
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? "bg-blue-50 text-blue-600" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
