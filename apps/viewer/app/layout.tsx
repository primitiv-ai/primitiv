import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Sidebar } from "@/components/sidebar";
import { LiveReloadClient } from "@/components/live-reload-client";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

const clashDisplay = localFont({
  src: "../public/fonts/ClashDisplay-Variable.woff2",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Primitiv Viewer",
  description: "Read-only viewer for Primitiv governance artifacts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${clashDisplay.variable} ${inter.className} h-screen overflow-hidden bg-background text-foreground antialiased`}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="px-6 py-8">{children}</div>
          </main>
        </div>
        <LiveReloadClient />
      </body>
    </html>
  );
}
