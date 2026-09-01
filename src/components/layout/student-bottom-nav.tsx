"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Clock, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
    { href: "/student/dashboard", icon: LayoutDashboard, label: "Home"      },
    { href: "/student/timetable", icon: Calendar,        label: "Timetable" },
    { href: "/student/history",   icon: Clock,           label: "History"   },
    { href: "/student/marks",     icon: BookOpen,        label: "Marks"     },
    { href: "/student/profile",   icon: User,            label: "Profile"   },
] as const;

export function StudentBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Blur backdrop */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-slate-100" />

            <div className="relative flex items-center justify-around px-2 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
                {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="student-nav-pill"
                                    className="absolute top-2 inset-x-2 h-9 rounded-2xl bg-slate-900"
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                            )}
                            <div className="relative z-10 flex flex-col items-center gap-0.5">
                                <Icon
                                    className={cn(
                                        "w-4.5 h-4.5 transition-colors",
                                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 1.75}
                                />
                                <span
                                    className={cn(
                                        "text-[9px] font-bold uppercase tracking-wider transition-colors",
                                        isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                                    )}
                                >
                                    {label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
