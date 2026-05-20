import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Owen Zen | Focus Dashboard",
  description: "A minimal, Zen-like productivity dashboard for focused work.",
  applicationName: "Owen Zen",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Owen Zen",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

import { TooltipProvider } from "@/components/ui/tooltip"
import { Providers } from "@/components/Providers";
import { cn } from "@/lib/utils";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="zen" className={cn("font-sans", plusJakartaSans.variable, jetbrainsMono.variable)}>
      <body className="antialiased min-h-screen relative">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <TooltipProvider delay={300}>
            <SpotlightEffect />
            <ServiceWorkerRegistration />
            {children}
            <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
