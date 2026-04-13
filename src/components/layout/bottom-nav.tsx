"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Search,
  Sparkles,
  Palette,
  FolderOpen,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Rocket, color: "text-purple-500" },
  { href: "/all", label: "Projects", icon: FolderOpen, color: "text-blue-500" },
  { href: "/projects/new", label: "New", icon: Search, color: "text-pink-500", special: true },
  { href: "#creative", label: "Create", icon: Sparkles, color: "text-amber-500" },
  { href: "#studio", label: "Studio", icon: Palette, color: "text-emerald-500" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Derive project-aware links for Create and Studio
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1];
  const isInProject = !!projectId && projectId !== "new";

  const resolvedTabs = tabs.map((tab) => {
    if (tab.href === "#creative" && isInProject) {
      return { ...tab, href: `/projects/${projectId}/creative` };
    }
    if (tab.href === "#studio" && isInProject) {
      return { ...tab, href: `/projects/${projectId}/studio` };
    }
    if (tab.href === "#creative" || tab.href === "#studio") {
      return { ...tab, href: "/", disabled: !isInProject };
    }
    return tab;
  });

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t-2 border-purple-100 safe-bottom">
      <div className="flex items-end justify-around px-2 pt-1 pb-2 max-w-lg mx-auto">
        {resolvedTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/"
              ? pathname === "/" || (isInProject && pathname.includes("/overview"))
              : pathname.startsWith(tab.href);
          const isSpecial = "special" in tab && tab.special;

          if (isSpecial) {
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full gradient-fun flex items-center justify-center shadow-lg shadow-purple-300/50 border-4 border-white active:scale-95 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-bold mt-0.5 text-purple-600">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all active:scale-95",
                isActive
                  ? "bg-purple-50"
                  : "opacity-60"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all",
                  isActive ? tab.color : "text-gray-400"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-bold",
                  isActive ? "text-purple-700" : "text-gray-400"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
