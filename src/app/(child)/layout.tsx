import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "StoryNest Kids",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StoryNest",
  },
};

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-child-bg overflow-x-hidden">
      {children}
    </div>
  );
}
