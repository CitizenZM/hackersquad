"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderPlus,
  Brain,
  Sparkles,
  Menu,
  X,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/projects/new", label: "New Project", icon: FolderPlus },
  { href: "/all", label: "All Projects", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Extract projectId from URL if we're in a project context
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1];
  const isInProject = !!projectId && projectId !== "new";

  const projectTabs = isInProject
    ? [
        { href: `/projects/${projectId}/overview`, label: "Overview", icon: LayoutDashboard },
      ]
    : [];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex h-14 items-center gap-3 border-b bg-card px-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brain className="h-5 w-5 text-primary" />
        <span className="font-bold text-sm tracking-tight">CreativeIntel OS</span>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-5">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">CreativeIntel OS</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden rounded-lg p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {projectTabs.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {isInProject && (
            <div className="my-2 border-t" />
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Powered by OpenAI</span>
          </div>
        </div>
      </aside>
    </>
  );
}
