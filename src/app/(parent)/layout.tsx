import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasParentAccess } from "@/lib/parent-access";
import { ParentSidebar } from "@/components/layout/parent-sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s | StoryNest Kids",
    default: "Parent Dashboard | StoryNest Kids",
  },
  robots: { index: false },
};

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasParentAccess())) {
    redirect("/parent-access");
  }

  return (
    <div className="flex min-h-screen">
      <ParentSidebar />
      <main className="w-full pt-14 md:pt-0 md:ml-60 md:flex-1">{children}</main>
    </div>
  );
}
