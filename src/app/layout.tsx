import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { IosInstallPrompt } from "@/components/layout/ios-install-prompt";
import { Providers } from "@/components/providers";
import { AppLoader } from "@/components/ui/app-loader";
import { BrandexSplash } from "@/components/ui/brandex-splash";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const outfit = Outfit({ 
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"]
});

export async function generateMetadata(): Promise<Metadata> {
  const brandName = "Attendex";
  
  return {
    title: brandName,
    description: "Advanced institutional command center for high-performance academic tracking.",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: brandName,
    },
    icons: {
      apple: "/icons/KLE_logo.jpg",
    },
    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    }
  };
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased overflow-x-hidden">
      <body className={`${outfit.className} min-h-full flex flex-col text-slate-900 pb-16 md:pb-0 overflow-x-hidden w-full max-w-full`}>
        <BrandexSplash />
        <Suspense fallback={null}>
          <AppLoader />
        </Suspense>
        <Providers>
          {children}
        </Providers>
        <MobileBottomNav />
        <Toaster />
        <IosInstallPrompt />
      </body>
    </html>
  );
}
