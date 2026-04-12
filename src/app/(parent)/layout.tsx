import { redirect } from "next/navigation";
import { getAuthFromCookies } from "@/lib/auth";
import { ParentSidebar } from "@/components/layout/parent-sidebar";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthFromCookies();
  if (!auth) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <ParentSidebar />
      <main className="ml-60 flex-1">{children}</main>
    </div>
  );
}
