import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { HeartbeatWidget } from "@/components/ui/HeartbeatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Manager Pro",
  description: "Advanced Agentic Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white min-h-screen`}>
        <Sidebar />

        <main className="pl-64 min-h-screen flex flex-col">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40">
            <div className="text-sm font-medium text-zinc-400">Workspace</div>
            <HeartbeatWidget />
          </header>
          <div className="p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
