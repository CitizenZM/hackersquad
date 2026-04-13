import { ParentSidebar } from "@/components/layout/parent-sidebar";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <ParentSidebar />
      <main className="ml-60 flex-1">{children}</main>
    </div>
  );
}
