"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Mic,
  Smile,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/progress", label: "Kid Progress", icon: TrendingUp },
  { href: "/children", label: "Children", icon: Users },
  { href: "/sources", label: "Sources", icon: FileText },
  { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/voices", label: "Voices", icon: Mic },
  { href: "/avatars", label: "Avatars", icon: Smile },
];

export function ParentSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleExit() {
    await fetch("/api/parent-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-60 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">StoryNest</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-2">
        <button
          onClick={handleExit}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Exit Parent Mode
        </button>
        <div className="px-3 py-1 text-xs text-sidebar-foreground/50">
          Parent Mode
        </div>
      </div>
    </aside>
  );
}
