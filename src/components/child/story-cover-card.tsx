"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ProgressRing } from "./progress-ring";
import { FavoriteButton } from "./favorite-button";

const GOAL_LABELS: Record<string, { emoji: string; text: string }> = {
  BEDTIME: { emoji: "🌙", text: "Bedtime" },
  ENTERTAIN: { emoji: "🎉", text: "Fun" },
  EDUCATE: { emoji: "📚", text: "Learn" },
  MORAL_LESSON: { emoji: "💛", text: "Lesson" },
  VOCABULARY: { emoji: "📝", text: "Words" },
};

interface StoryCoverCardProps {
  childId: string;
  storyPackId: string;
  title: string;
  coverImageUrl?: string | null;
  episodeCount: number;
  completedEpisodes: number;
  isNew?: boolean;
  isFavorite?: boolean;
  storyGoal: string;
  index: number;
}

export function StoryCoverCard({
  childId,
  storyPackId,
  title,
  coverImageUrl,
  episodeCount,
  completedEpisodes,
  isNew,
  isFavorite = false,
  storyGoal,
  index,
}: StoryCoverCardProps) {
  const progress = episodeCount > 0 ? completedEpisodes / episodeCount : 0;
  const isCapacitor =
    typeof window !== "undefined" && !!(window as unknown as { Capacitor?: unknown }).Capacitor;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
    >
      <Link href={`/play/${childId}/${storyPackId}`} className="group block">
        <motion.div
          whileTap={{ scale: 0.96 }}
          className="relative overflow-hidden rounded-3xl bg-child-surface shadow-md shadow-black/8 transition-shadow group-active:shadow-lg"
        >
          {/* Cover image */}
          <div className="aspect-[4/5] relative">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-child-primary/20 to-child-accent/20">
                <BookOpen className="h-16 w-16 text-child-primary/40" />
              </div>
            )}

            {/* Title overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 pt-12">
              <h3 className="text-base font-bold text-white leading-tight line-clamp-2 drop-shadow-sm">
                {title}
              </h3>
              <p className="text-xs text-white/70 mt-0.5">
                {episodeCount} episode{episodeCount !== 1 ? "s" : ""}
              </p>
              {GOAL_LABELS[storyGoal] && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {GOAL_LABELS[storyGoal].emoji} {GOAL_LABELS[storyGoal].text}
                </span>
              )}
            </div>

            {/* Progress ring top-right */}
            {completedEpisodes > 0 && (
              <div className="absolute top-3 right-3">
                <ProgressRing progress={progress} size={36} strokeWidth={3} />
              </div>
            )}

            {/* Favorite button top-left */}
            <FavoriteButton
              storyPackId={storyPackId}
              childId={childId}
              isFavorite={isFavorite}
            />

            {/* NEW badge — shifted down when favorite button is present */}
            {isNew && completedEpisodes === 0 && (
              <div className="absolute top-12 left-3 rounded-full bg-child-accent px-3 py-1 shadow-md">
                <span className="text-xs font-bold text-white">NEW</span>
              </div>
            )}

            {/* Download / offline indicator */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              {isCapacitor ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Capacitor offline caching would be triggered here
                  }}
                  aria-label="Download for offline"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-lg leading-none active:scale-90 transition-transform"
                >
                  📥
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTooltip((v) => !v);
                    }}
                    aria-label="Available in the app"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-lg leading-none"
                  >
                    📥
                  </button>
                  {showTooltip && (
                    <div className="absolute bottom-9 right-0 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-xs text-white shadow-lg">
                      Available in the app
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
