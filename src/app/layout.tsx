import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreativeIntel OS",
  description:
    "AI-powered brand intelligence and creative strategy platform for e-commerce brands",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <TooltipProvider>
          <Sidebar />
          <main className="ml-64 min-h-screen">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
