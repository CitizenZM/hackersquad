import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/layout/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreativeIntel OS",
  description: "AI-powered brand intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full font-sans pb-20">
        <TooltipProvider>
          <main className="min-h-screen">{children}</main>
          <BottomNav />
        </TooltipProvider>
      </body>
    </html>
  );
}
