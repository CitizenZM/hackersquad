import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryNest Kids",
  description: "Transform any content into personalized 5-minute story episodes for children aged 3-9",
  manifest: "/manifest.json",
  openGraph: {
    title: "StoryNest Kids",
    description: "Personalized AI story episodes for children",
    type: "website",
    siteName: "StoryNest Kids",
  },
  twitter: {
    card: "summary",
    title: "StoryNest Kids",
    description: "Personalized AI story episodes for children",
  },
  robots: {
    index: true,
    follow: true,
  },
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
