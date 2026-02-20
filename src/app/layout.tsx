import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
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
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased min-h-screen relative`}>
        <SpotlightEffect />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
