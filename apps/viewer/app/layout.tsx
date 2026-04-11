import type { Metadata } from "next";
import { Lato } from "next/font/google";
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
      <body className={`${lato.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
