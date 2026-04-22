import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryNest Kids",
  description:
    "Transform any content into personalized 5-minute story episodes for children",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
