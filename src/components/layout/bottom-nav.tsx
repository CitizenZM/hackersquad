"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  FolderKanban,
  Wand2,
  Palette,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: LayoutGrid, match: (p: string) => p === "/" || p.includes("/overview") },
  { href: "/all", label: "Projects", icon: FolderKanban, match: (p: string) => p.startsWith("/all") },
  { href: "#creative", label: "Create", icon: Wand2, match: (p: string) => p.includes("/creative") },
  { href: "#studio", label: "Studio", icon: Palette, match: (p: string) => p.includes("/studio") },
];

export function BottomNav() {
  const pathname = usePathname();
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1];
  const isInProject = !!projectId && projectId !== "new";

  const resolvedTabs = tabs.map((tab) => {
    if (tab.href === "#creative") {
      return {
        ...tab,
        href: isInProject ? `/projects/${projectId}/creative` : "/projects/new",
      };
    }
    if (tab.href === "#studio") {
      return {
        ...tab,
        href: isInProject ? `/projects/${projectId}/studio` : "/projects/new",
      };
    }
    return tab;
  });

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="flex items-stretch justify-around">
        {resolvedTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match(pathname);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
