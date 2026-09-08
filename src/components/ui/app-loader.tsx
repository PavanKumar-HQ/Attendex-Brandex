"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AppLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Trigger smooth transition effect whenever route changes
    setLoading(true);
    setProgress(25);

    const timer1 = setTimeout(() => setProgress(65), 100);
    const timer2 = setTimeout(() => setProgress(90), 200);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 150);
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Top Progress Track */}
      <div className="h-[3px] w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(37,99,235,0.6)]"
          style={{
            width: `${progress}%`,
            transition: progress === 100 ? "width 150ms ease-out, opacity 150ms 100ms" : "width 200ms ease-in-out"
          }}
        />
      </div>
    </div>
  );
}
