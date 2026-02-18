import { Manrope } from "next/font/google";
import "./globals.css";
import { SpotlightEffect } from "@/components/SpotlightEffect";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata = {
  title: "Owen Zen | Focus Dashboard",
  description: "A minimal, Zen-like productivity dashboard for focused work.",
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
        {children}
      </body>
    </html>
  );
}
