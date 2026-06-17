"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { StoryCoverCard } from "@/components/child/story-cover-card";
import { Mascot } from "@/components/child/mascot";
import { BedtimeToggle } from "@/components/child/bedtime-toggle";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { Home, Play, BookOpen } from "lucide-react";

interface StoryShelfProps {
  childId: string;
  childName: string;
  streak: number;
  storyPacks: Array<{
    id: string;
    title: string;
    coverImageUrl: string | null;
    episodeCount: number;
    completedEpisodes: number;
    isFavorite: boolean;
  }>;
  continueData: {
    storyPackId: string;
    storyTitle: string;
    coverImageUrl: string | null;
    episodeId: string;
    episodeNumber: number;
    episodeTitle: string;
  } | null;
}

export function StoryShelf({
  childId,
  childName,
  streak,
  storyPacks,
  continueData,
}: StoryShelfProps) {
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();

  useEffect(() => {
    // Voice greeting after a brief delay (allows the page to render)
    const timer = setTimeout(() => {
      speak(`Hi ${childName}! Let's pick a story!`, { pitch: 1.2 });
    }, 600);
    return () => clearTimeout(timer);
  }, [childName, speak]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-5 pt-6 safe-top safe-x bg-gradient-to-b from-amber-50 via-rose-50 to-violet-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center gap-3"
      >
        <Mascot
          mood="happy"
          size={70}
          onTap={() => {
            play("pop");
            speak(`Hi ${childName}! What shall we read?`);
          }}
        />
        <div className="flex-1">
          <h1 className="child-heading leading-tight">Hi {childName}!</h1>
          <p className="child-caption text-foreground/50">
            Pick a story to explore
          </p>
        </div>
        <BedtimeToggle />
      </motion.div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 p-4 mb-6">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="child-title text-amber-800">{streak} Day Streak!</div>
            <div className="child-caption text-amber-600">Keep listening every day!</div>
          </div>
        </div>
      )}

      {/* Continue banner */}
      {continueData && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href={`/play/${childId}/${continueData.storyPackId}/${continueData.episodeId}`}
            onClick={() => play("pop")}
            className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-child-primary to-indigo-500 p-4 shadow-lg shadow-child-primary/30 active:scale-[0.98] transition-transform"
          >
            {continueData.coverImageUrl ? (
              <img
                src={continueData.coverImageUrl}
                alt=""
                className="h-16 w-16 rounded-xl object-cover shadow-md ring-2 ring-white/50"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="child-caption text-white/80">Keep listening</p>
              <p className="font-bold text-white truncate">
                {continueData.storyTitle}
              </p>
              <p className="text-xs text-white/60">
                Episode {continueData.episodeNumber}
              </p>
            </div>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <Play className="h-5 w-5 text-child-primary ml-0.5" fill="currentColor" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Story grid */}
      {storyPacks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-20">
          <Mascot mood="curious" size={120} />
          <p className="child-body text-foreground/40 mt-4">No stories yet!</p>
          <p className="child-caption text-foreground/30">
            Ask a parent to create one.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-4 pb-24"
          onClickCapture={() => play("tap")}
        >
          {storyPacks.map((pack, i) => (
            <StoryCoverCard
              key={pack.id}
              childId={childId}
              storyPackId={pack.id}
              title={pack.title}
              coverImageUrl={pack.coverImageUrl}
              episodeCount={pack.episodeCount}
              completedEpisodes={pack.completedEpisodes}
              isNew={i === 0}
              isFavorite={pack.isFavorite}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Bottom home button */}
      <div className="fixed bottom-0 inset-x-0 flex justify-center pb-4 safe-bottom pointer-events-none">
        <Link
          href="/play"
          onClick={() => play("whoosh")}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg shadow-black/10 active:scale-95 transition-transform ring-2 ring-child-primary/10"
        >
          <Home className="h-6 w-6 text-child-primary" />
        </Link>
      </div>
    </div>
  );
}
