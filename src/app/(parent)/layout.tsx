import { redirect } from "next/navigation";
import { hasParentAccess } from "@/lib/parent-access";
import { ParentSidebar } from "@/components/layout/parent-sidebar";

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
      <main className="ml-60 flex-1">{children}</main>
    </div>
  );
}
