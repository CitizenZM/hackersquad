"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { JourneyMap } from "@/components/child/journey-map";
import { Mascot } from "@/components/child/mascot";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
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
    teaser?: string;
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
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();
  const completedCount = episodes.filter((e) => e.state === "completed").length;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (completedCount === 0) {
        speak(`Let's start ${title}!`, { pitch: 1.2 });
      } else {
        speak(`You've finished ${completedCount} chapter${completedCount > 1 ? "s" : ""}! Keep going!`, { pitch: 1.15 });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [title, completedCount, speak]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-sky-100 via-violet-50 to-rose-100">
      {/* Blurred background */}
      {coverImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
          style={{ backgroundImage: `url(${coverImageUrl})` }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col safe-top safe-x">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <Link
            href={`/play/${childId}`}
            onClick={() => play("whoosh")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt={title}
              className="h-12 w-12 rounded-xl object-cover shadow"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="child-title truncate leading-tight">{title}</h1>
            <p className="child-caption text-foreground/50">
              {completedCount} / {episodes.length} complete
            </p>
          </div>
        </div>

        {/* Mascot hint */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 px-5 pb-2"
        >
          <Mascot
            mood="curious"
            size={64}
            onTap={() => {
              play("pop");
              speak("Tap the glowing circle to play!");
            }}
          />
          <div className="relative flex-1 rounded-2xl bg-white px-4 py-2 shadow">
            <p className="child-caption">
              <span className="font-semibold text-child-primary">Tap the glowing circle</span> to play!
            </p>
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 h-4 w-4 rotate-45 bg-white" />
          </div>
        </motion.div>

        {/* Journey map - scrollable */}
        <div
          className="flex-1 overflow-y-auto py-4"
          onClickCapture={() => play("tap")}
        >
          <JourneyMap
            childId={childId}
            storyPackId={storyPackId}
            nodes={episodes}
          />
        </div>

        {/* Play next button */}
        {nextEpisodeId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-5 pb-6 safe-bottom"
          >
            <Link
              href={`/play/${childId}/${storyPackId}/${nextEpisodeId}`}
              onClick={() => play("sparkle")}
              className="flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-child-primary to-indigo-500 py-4 px-8 shadow-lg shadow-child-primary/30 active:scale-[0.97] transition-transform"
            >
              <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
              <span className="text-lg font-bold text-white">
                {completedCount === 0 ? "Start Adventure" : "Continue"}
              </span>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
