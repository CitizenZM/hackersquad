"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoryCoverCard } from "@/components/child/story-cover-card";
import { Mascot } from "@/components/child/mascot";
import { BedtimeToggle } from "@/components/child/bedtime-toggle";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { useBedtimeMode } from "@/lib/hooks/use-bedtime-mode";
import { Home, Play, BookOpen } from "lucide-react";

const goalFilters = [
  { value: "all", label: "All", emoji: "📖" },
  { value: "BEDTIME", label: "Bedtime", emoji: "🌙" },
  { value: "ENTERTAIN", label: "Fun", emoji: "🎉" },
  { value: "EDUCATE", label: "Learn", emoji: "📚" },
];

interface StoryShelfProps {
  childId: string;
  childName: string;
  streak: number;
  storyPacks: Array<{
    id: string;
    title: string;
    description?: string;
    coverImageUrl: string | null;
    episodeCount: number;
    completedEpisodes: number;
    estimatedMinutes: number;
    isFavorite: boolean;
    storyGoal: string;
  }>;
  weeklyEpisodes: number;
  continueData: {
    storyPackId: string;
    storyTitle: string;
    coverImageUrl: string | null;
    episodeId: string;
    episodeNumber: number;
    episodeTitle: string;
  } | null;
  recentPlays: Array<{
    id: string;
    storyPackId: string;
    storyTitle: string;
    episodeId: string;
    episodeNumber: number;
    episodeTitle: string;
  }>;
  vocabWords: Array<{
    id: string;
    word: string;
    definition: string;
  }>;
}

export function StoryShelf({
  childId,
  childName,
  streak,
  weeklyEpisodes,
  storyPacks,
  continueData,
  recentPlays,
  vocabWords,
}: StoryShelfProps) {
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();
  const { isBedtime } = useBedtimeMode();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  const { greeting, subtitle, mascotMood } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Good morning, ${childName}! ☀️`,
        subtitle: "What shall we explore today?",
        mascotMood: "happy" as const,
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: `Good afternoon, ${childName}! 🌤️`,
        subtitle: "Ready for an adventure?",
        mascotMood: "happy" as const,
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        greeting: `Good evening, ${childName}! 🌅`,
        subtitle: "Pick a story for tonight!",
        mascotMood: "sleepy" as const,
      };
    } else {
      return {
        greeting: `Time for a story, ${childName}! 🌙`,
        subtitle: "Let's read a bedtime story",
        mascotMood: "sleepy" as const,
      };
    }
  }, [childName]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("notif-dismissed")) {
      setShowNotifBanner(true);
    }
  }, []);

  function dismissNotif() {
    localStorage.setItem("notif-dismissed", "1");
    setShowNotifBanner(false);
  }

  async function handleTurnOnNotifications() {
    const isCapacitor =
      typeof window !== "undefined" &&
      !!(window as unknown as { Capacitor?: unknown }).Capacitor;
    if (isCapacitor) {
      try {
        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );
        await PushNotifications.requestPermissions();
      } catch {
        // silently ignore if plugin is unavailable
      }
    }
    dismissNotif();
  }

  useEffect(() => {
    if (isBedtime) {
      setActiveFilter("BEDTIME");
    } else {
      setActiveFilter("all");
    }
  }, [isBedtime]);

  useEffect(() => {
    // Voice greeting after a brief delay (allows the page to render)
    const timer = setTimeout(() => {
      speak(`${greeting} ${subtitle}`, { pitch: 1.2 });
    }, 600);
    return () => clearTimeout(timer);
  }, [greeting, subtitle, speak]);

  const filteredPacks =
    activeFilter === "all"
      ? storyPacks
      : storyPacks.filter((p) => p.storyGoal === activeFilter);

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-5 pt-6 safe-top safe-x bg-gradient-to-b from-amber-50 via-rose-50 to-violet-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center gap-3"
      >
        <Mascot
          mood={mascotMood}
          size={70}
          onTap={() => {
            play("pop");
            speak(`Hi ${childName}! What shall we read?`);
          }}
        />
        <div className="flex-1">
          <h1 className="child-heading leading-tight">{greeting}</h1>
          <p className="child-caption text-foreground/50">
            {subtitle}
          </p>
        </div>
        <BedtimeToggle />
      </motion.div>

      {/* Notifications prompt banner */}
      {showNotifBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-100 to-indigo-100 px-4 py-3 shadow-sm"
        >
          <span className="text-2xl">🔔</span>
          <p className="flex-1 text-sm font-semibold text-violet-800">
            Get reminders when new stories are ready!
          </p>
          <button
            onClick={handleTurnOnNotifications}
            className="rounded-full bg-violet-500 px-3 py-1 text-xs font-bold text-white shadow active:scale-95 transition-transform"
          >
            Turn On
          </button>
          <button
            onClick={dismissNotif}
            aria-label="Dismiss"
            className="text-violet-400 text-lg leading-none active:scale-95 transition-transform"
          >
            ×
          </button>
        </motion.div>
      )}

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

      {/* Weekly Goal */}
      {(() => {
        const WEEKLY_GOAL = 5;
        const weeklyProgress = Math.min(weeklyEpisodes / WEEKLY_GOAL, 1);
        return (
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="child-caption font-semibold text-blue-800">
                  Weekly Goal
                </span>
              </div>
              <span className="child-caption text-blue-600">
                {weeklyEpisodes}/{WEEKLY_GOAL} episodes
              </span>
            </div>
            <div className="h-3 rounded-full bg-blue-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                style={{ width: `${weeklyProgress * 100}%` }}
              />
            </div>
            {weeklyEpisodes >= WEEKLY_GOAL && (
              <p className="child-caption text-blue-600 mt-2 text-center">
                🌟 Goal reached! Amazing listener!
              </p>
            )}
          </div>
        );
      })()}

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

      {/* Goal filter pills */}
      {storyPacks.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {goalFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                play("tap");
                setActiveFilter(filter.value);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeFilter === filter.value
                  ? "bg-child-primary text-white shadow-md shadow-child-primary/30"
                  : "bg-white/70 text-foreground/70 shadow-sm"
              }`}
            >
              <span>{filter.emoji}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bedtime Playlist button */}
      {isBedtime && filteredPacks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <button
            onClick={() => {
              play("sparkle");
              // Navigate to the first bedtime story's first episode
              const firstBedtime = filteredPacks[0];
              if (firstBedtime) {
                router.push(`/play/${childId}/${firstBedtime.id}`);
              }
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white text-center shadow-lg active:scale-[0.98] transition-transform"
          >
            <span className="text-2xl block mb-1">🌙</span>
            <span className="child-body font-semibold">Start Bedtime Playlist</span>
            <span className="block child-caption text-white/70 mt-0.5">
              {filteredPacks.length} bedtime {filteredPacks.length === 1 ? "story" : "stories"} ready
            </span>
          </button>
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
      ) : filteredPacks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-20">
          <Mascot mood="curious" size={100} />
          <p className="child-body text-foreground/40 mt-4">No stories here yet!</p>
          <p className="child-caption text-foreground/30">
            Try a different filter.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-4 pb-24"
          onClickCapture={() => play("tap")}
        >
          {filteredPacks.map((pack, i) => (
            <StoryCoverCard
              key={pack.id}
              childId={childId}
              storyPackId={pack.id}
              title={pack.title}
              description={pack.description}
              coverImageUrl={pack.coverImageUrl}
              episodeCount={pack.episodeCount}
              completedEpisodes={pack.completedEpisodes}
              estimatedMinutes={pack.estimatedMinutes}
              isNew={i === 0}
              isFavorite={pack.isFavorite}
              storyGoal={pack.storyGoal}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Recently Played */}
      {recentPlays.length > 0 && (
        <div className="mt-6">
          <h3 className="child-caption text-foreground/60 mb-3 px-1">Recently Played</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {recentPlays.map((play) => (
              <Link
                key={play.id}
                href={`/play/${childId}/${play.storyPackId}/${play.episodeId}`}
                className="flex-shrink-0 w-40 rounded-xl bg-child-surface shadow-sm p-3 active:scale-95 transition-transform"
              >
                <p className="child-caption font-semibold text-foreground/80 truncate">
                  {play.storyTitle}
                </p>
                <p className="text-xs text-foreground/50 truncate">
                  Ep {play.episodeNumber}: {play.episodeTitle}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Learning Cards */}
      {vocabWords.length > 0 && (
        <div className="mt-6 mb-2">
          <h3 className="child-caption text-foreground/60 mb-3 px-1 flex items-center gap-1.5">
            📝 Words You Know
          </h3>
          <div className="flex flex-wrap gap-2 pb-24">
            {vocabWords.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  speak(v.word + ". " + v.definition, { tone: "gentle" });
                  play("sparkle");
                }}
                className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 text-sm font-medium text-purple-800 shadow-sm active:scale-95 transition-transform"
              >
                {v.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 inset-x-0 flex justify-center gap-4 pb-4 safe-bottom pointer-events-none">
        <Link
          href={`/play/${childId}/calm`}
          onClick={() => play("sparkle")}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 shadow-lg shadow-black/10 active:scale-95 transition-transform"
          aria-label="Calm Corner"
        >
          <span className="text-xl">🧘</span>
        </Link>
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
