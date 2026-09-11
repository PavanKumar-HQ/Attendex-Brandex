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
      <a
        href="https://brandex.co.in"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors group cursor-pointer", className)}
        title="Powered by Brandex • brandex.co.in"
      >
        <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">Powered by</span>
        <img
          src="/brandex-logo.png"
          alt="Brandex"
          className="h-4 w-auto object-contain brightness-95 group-hover:brightness-105 group-hover:scale-105 transition-all"
        />
      </a>
    );
  }

  if (variant === "sidebar") {
    return (
      <a
        href="https://brandex.co.in"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("px-3 py-2 border-t border-slate-100 flex flex-col items-center justify-center gap-1 group hover:bg-slate-50/80 transition-all cursor-pointer", className)}
        title="Powered by Brandex • brandex.co.in"
      >
        <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
          Powered by
        </span>
        <img
          src="/brandex-logo.png"
          alt="Brandex"
          className="h-5 w-auto max-w-[120px] object-contain transition-transform group-hover:scale-105"
        />
      </a>
    );
  }

  if (variant === "badge") {
    return (
      <a
        href="https://brandex.co.in"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white shadow-sm border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer group", className)}
        title="Powered by Brandex • brandex.co.in"
      >
        <span className="text-[10px] tracking-wider uppercase font-medium text-slate-400 group-hover:text-white transition-colors">Powered by</span>
        <img
          src="/brandex-logo.png"
          alt="Brandex"
          className="h-5 w-auto object-contain invert brightness-200 group-hover:scale-105 transition-transform"
        />
      </a>
    );
  }

  // Default: Footer variant
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-500", className)}>
      <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
        Powered by
      </span>
      <a 
        href="https://brandex.co.in" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center hover:opacity-90 transition-opacity cursor-pointer group"
        title="Powered by Brandex • brandex.co.in"
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
