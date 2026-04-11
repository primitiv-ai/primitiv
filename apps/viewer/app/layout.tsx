import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { LiveReloadClient } from "@/components/live-reload-client";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Primitiv Viewer",
  description: "Read-only viewer for Primitiv governance artifacts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${lato.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
          </main>
        </div>
        <LiveReloadClient />
      </body>
    </html>
  );
}
