"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BrandingProvider } from "@/context/branding-context";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes cache freshness for instant loads
        gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection retention
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 2,
      },
    },
  }));

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // In development / localhost mode, unregister any active workers to avoid dev server & HMR clashes
      const isDev = process.env.NODE_ENV === "development" || 
                    window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1";

      if (isDev) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        }).catch(() => {});
        return;
      }

      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New version available
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration notice:", err);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}
