"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Film,
  Lightbulb,
  Users,
  Wand2,
  Palette,
} from "lucide-react";

interface TabNavProps {
  projectId: string;
}

const tabs = [
  { segment: "overview", label: "Overview", icon: LayoutDashboard },
  { segment: "content", label: "Content", icon: Film },
  { segment: "insights", label: "Insights", icon: Lightbulb },
  { segment: "creative", label: "Creative", icon: Wand2 },
  { segment: "studio", label: "Studio", icon: Palette },
];

export function TabNav({ projectId }: TabNavProps) {
  const pathname = usePathname();

  return (
    <div className="border-b bg-card px-8">
      <nav className="flex gap-1 -mb-px">
        {tabs.map((tab) => {
          const href = `/projects/${projectId}/${tab.segment}`;
          const isActive = pathname.startsWith(href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
