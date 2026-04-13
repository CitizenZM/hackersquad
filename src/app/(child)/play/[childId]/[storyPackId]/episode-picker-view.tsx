"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EpisodeBubble } from "@/components/child/episode-bubble";
import { ChevronLeft, Play } from "lucide-react";

interface EpisodePickerViewProps {
  childId: string;
  storyPackId: string;
  title: string;
  coverImageUrl: string | null;
  episodes: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    thumbnailUrl: string | null;
    state: "completed" | "current" | "future";
  }>;
  nextEpisodeId?: string;
}

export function EpisodePickerView({
  childId,
  storyPackId,
  title,
  coverImageUrl,
  episodes,
  nextEpisodeId,
}: EpisodePickerViewProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      {/* Blurred background */}
      {coverImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-110"
          style={{ backgroundImage: `url(${coverImageUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-child-bg/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col safe-top safe-x">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 pt-4 pb-2">
          <Link
            href={`/play/${childId}`}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-child-surface shadow-md active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt={title}
              className="h-14 w-14 rounded-xl object-cover shadow"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="child-title truncate">{title}</h1>
            <p className="child-caption text-foreground/50">
              {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Episode bubbles - horizontal scroll */}
        <div className="flex-1 flex items-center">
          <div className="w-full overflow-x-auto px-5 py-6">
            <div className="flex gap-5 min-w-min">
              {episodes.map((ep, i) => (
                <EpisodeBubble
                  key={ep.id}
                  childId={childId}
                  storyPackId={storyPackId}
                  episodeId={ep.id}
                  episodeNumber={ep.episodeNumber}
                  title={ep.title}
                  thumbnailUrl={ep.thumbnailUrl}
                  state={ep.state}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Play next button */}
        {nextEpisodeId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-5 pb-6 safe-bottom"
          >
            <Link
              href={`/play/${childId}/${storyPackId}/${nextEpisodeId}`}
              className="flex items-center justify-center gap-3 rounded-full bg-child-primary py-4 px-8 shadow-lg shadow-child-primary/30 active:scale-[0.97] transition-transform"
            >
              <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
              <span className="text-lg font-bold text-white">Play</span>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
