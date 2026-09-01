import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { IosInstallPrompt } from "@/components/layout/ios-install-prompt";
import { Providers } from "@/components/providers";

const outfit = Outfit({ subsets: ["latin"] });

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
      <body className={`${outfit.className} min-h-full flex flex-col text-slate-900`}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <IosInstallPrompt />
      </body>
    </html>
  );
}
