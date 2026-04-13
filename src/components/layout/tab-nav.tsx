"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabNavProps {
  projectId: string;
}

const tabs = [
  { segment: "overview", label: "Overview", emoji: "🏠" },
  { segment: "content", label: "Content", emoji: "🎬" },
  { segment: "insights", label: "Insights", emoji: "💡" },
  { segment: "creative", label: "Create", emoji: "✨" },
  { segment: "studio", label: "Studio", emoji: "🎨" },
];

export function TabNav({ projectId }: TabNavProps) {
  const pathname = usePathname();

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b-2 border-purple-100 overflow-x-auto scrollbar-none">
      <div className="flex gap-1 min-w-max px-3 sm:px-6 py-2 max-w-4xl mx-auto">
        {tabs.map((tab) => {
          const href = `/projects/${projectId}/${tab.segment}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 whitespace-nowrap",
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-300/50"
                  : "bg-purple-50 text-purple-400 hover:bg-purple-100"
              )}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
