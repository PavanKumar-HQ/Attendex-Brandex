"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface PoweredByBrandexProps {
  className?: string;
  variant?: "footer" | "sidebar" | "badge" | "compact";
  theme?: "light" | "dark" | "auto";
}

export function PoweredByBrandex({
  className,
  variant = "footer",
  theme = "auto"
}: PoweredByBrandexProps) {
  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs text-slate-500", className)}>
        <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">Powered by</span>
        <img
          src="/brandex-logo.png"
          alt="Brandex"
          className="h-4 w-auto object-contain brightness-95 hover:brightness-105 transition-all"
        />
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("px-3 py-2 border-t border-slate-100 flex flex-col items-center justify-center gap-1", className)}>
        <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">
          Powered by
        </span>
        <img
          src="/brandex-logo.png"
          alt="Brandex"
          className="h-5 w-auto max-w-[120px] object-contain transition-transform hover:scale-105"
        />
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white shadow-sm border border-slate-800", className)}>
        <span className="text-[10px] tracking-wider uppercase font-medium text-slate-400">Powered by</span>
        <img
          src="/brandex-logo.png"
          alt="Brandex"
          className="h-5 w-auto object-contain invert brightness-200"
        />
      </div>
    );
  }

  // Default: Footer variant
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-500", className)}>
      <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
        Powered by
      </span>
      <a 
        href="https://github.com/PavanKumar-HQ/Attendex-Brandex" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center hover:opacity-90 transition-opacity"
        title="Brandex Academic Operating System"
      >
        <img
          src="/brandex-logo.png"
          alt="Brandex"
          className="h-6 sm:h-7 w-auto object-contain hover:scale-105 transition-transform duration-200"
        />
      </a>
    </div>
  );
}
