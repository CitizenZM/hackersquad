"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { StoryCoverCard } from "@/components/child/story-cover-card";
import { Home, Play, BookOpen } from "lucide-react";

interface StoryShelfProps {
  childId: string;
  childName: string;
  storyPacks: Array<{
    id: string;
    title: string;
    coverImageUrl: string | null;
    episodeCount: number;
    completedEpisodes: number;
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
  storyPacks,
  continueData,
}: StoryShelfProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pt-6 safe-top safe-x">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="child-heading">
          Hi {childName}! <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="child-caption text-foreground/50 mt-1">
          What story shall we read?
        </p>
      </motion.div>

      {/* Continue banner */}
      {continueData && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href={`/play/${childId}/${continueData.storyPackId}/${continueData.episodeId}`}
            className="mb-6 flex items-center gap-4 rounded-2xl bg-child-primary/10 p-4 active:bg-child-primary/15 transition-colors"
          >
            {continueData.coverImageUrl ? (
              <img
                src={continueData.coverImageUrl}
                alt=""
                className="h-16 w-16 rounded-xl object-cover shadow"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-child-primary/20">
                <BookOpen className="h-7 w-7 text-child-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="child-caption text-child-primary">Keep listening</p>
              <p className="font-semibold text-foreground truncate">
                {continueData.storyTitle}
              </p>
              <p className="text-xs text-foreground/50">
                Episode {continueData.episodeNumber}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-child-primary shadow-lg">
              <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Story grid */}
      {storyPacks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-20">
          <BookOpen className="h-20 w-20 text-foreground/10 mb-4" />
          <p className="child-body text-foreground/30">No stories yet!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-24">
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
              index={i}
            />
          ))}
        </div>
      )}

      {/* Bottom home button */}
      <div className="fixed bottom-0 inset-x-0 flex justify-center pb-4 safe-bottom pointer-events-none">
        <Link
          href="/play"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-child-surface shadow-lg shadow-black/10 active:scale-95 transition-transform"
        >
          <Home className="h-6 w-6 text-foreground/60" />
        </Link>
      </div>
    </div>
  );
}
