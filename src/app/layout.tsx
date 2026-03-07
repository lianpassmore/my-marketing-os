import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from './_components/Sidebar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Signal by DreamStorm",
  description: "Send signals, not noise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-surface-cloud text-content-ink flex h-screen overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
