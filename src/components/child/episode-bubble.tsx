"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";

interface EpisodeBubbleProps {
  childId: string;
  storyPackId: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  thumbnailUrl?: string | null;
  state: "completed" | "current" | "future";
  index: number;
}

export function EpisodeBubble({
  childId,
  storyPackId,
  episodeId,
  episodeNumber,
  title,
  thumbnailUrl,
  state,
  index,
}: EpisodeBubbleProps) {
  const isPlayable = state !== "future";

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        stiffness: 300,
        damping: 22,
      }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        whileTap={isPlayable ? { scale: 0.9 } : undefined}
        className={`relative flex h-[100px] w-[100px] items-center justify-center rounded-full shadow-md transition-all ${
          state === "completed"
            ? "bg-green-400 shadow-green-200"
            : state === "current"
            ? "bg-child-primary animate-pulse-glow shadow-child-primary/30"
            : "bg-child-muted opacity-50"
        }`}
      >
        {thumbnailUrl && state !== "future" ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full rounded-full object-cover"
          />
        ) : state === "completed" ? (
          <Check className="h-10 w-10 text-white" strokeWidth={3} />
        ) : (
          <span
            className={`text-3xl font-bold ${
              state === "current" ? "text-white" : "text-foreground/30"
            }`}
          >
            {episodeNumber}
          </span>
        )}

        {/* Star badge for completed */}
        {state === "completed" && (
          <div className="absolute -top-1 -right-1 text-xl">⭐</div>
        )}
      </motion.div>

      <p
        className={`text-center text-sm font-medium leading-tight max-w-[100px] line-clamp-2 ${
          state === "future" ? "text-foreground/30" : "text-foreground/70"
        }`}
      >
        {title}
      </p>
    </motion.div>
  );

  if (isPlayable) {
    return (
      <Link href={`/play/${childId}/${storyPackId}/${episodeId}`}>
        {content}
      </Link>
    );
  }

  return content;
}
