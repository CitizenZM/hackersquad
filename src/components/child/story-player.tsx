"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { Home, RotateCcw, Play, Pause, SkipForward, ChevronLeft } from "lucide-react";

interface FlashcardScene {
  id: string;
  sceneOrder: number;
  imageUrl: string | null;
  textSnippet: string;
  duration: number | null;
}

interface StoryPlayerProps {
  childId: string;
  storyPackId: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  audioUrl: string | null;
  scenes: FlashcardScene[];
  nextEpisodeId?: string;
  totalEpisodes: number;
}

export function StoryPlayer({
  childId,
  storyPackId,
  episodeId,
  episodeTitle,
  episodeNumber,
  audioUrl,
  scenes,
  nextEpisodeId,
  totalEpisodes,
}: StoryPlayerProps) {
  const router = useRouter();
  const [currentScene, setCurrentScene] = useState(0);
  const { isPlaying, currentTime, duration, togglePlay, restart } =
    useAudioPlayer(audioUrl);

  // Auto-advance scenes based on timing
  useEffect(() => {
    if (!isPlaying || scenes.length === 0) return;

    let elapsed = 0;
    for (let i = 0; i < scenes.length; i++) {
      elapsed += scenes[i].duration || (duration / scenes.length);
      if (currentTime < elapsed) {
        if (i !== currentScene) setCurrentScene(i);
        break;
      }
    }
  }, [currentTime, isPlaying, scenes, duration, currentScene]);

  // Log session event
  useEffect(() => {
    fetch("/api/play/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childProfileId: childId,
        storyPackId,
        episodeId,
        eventType: "EPISODE_START",
      }),
    }).catch(() => {});
  }, [childId, storyPackId, episodeId]);

  const goToScene = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(scenes.length - 1, index));
      setCurrentScene(clamped);
    },
    [scenes.length]
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToScene(currentScene + 1),
    onSwipedRight: () => goToScene(currentScene - 1),
    trackMouse: true,
  });

  const scene = scenes[currentScene];
  const isComplete = !isPlaying && currentTime > 0 && currentTime >= duration - 0.5;

  return (
    <div className="flex min-h-screen flex-col bg-child-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 safe-area-inset">
        <button
          onClick={() => router.push(`/play/${childId}/${storyPackId}`)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-child-surface shadow"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Episode {episodeNumber} of {totalEpisodes}</p>
          <p className="text-sm font-medium">{episodeTitle}</p>
        </div>
        <button
          onClick={() => router.push(`/play/${childId}`)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-child-surface shadow"
        >
          <Home className="h-5 w-5" />
        </button>
      </div>

      {/* Scene dots */}
      <div className="flex justify-center gap-1.5 px-4 py-2">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => goToScene(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentScene ? "w-6 bg-primary" : "w-2 bg-primary/30"
            }`}
          />
        ))}
      </div>

      {/* Flashcard Display */}
      <div className="flex-1 px-4 py-2" {...swipeHandlers}>
        <AnimatePresence mode="wait">
          {scene && (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="mx-auto flex h-full max-w-lg flex-col"
            >
              {/* Image */}
              <div className="flex-1 overflow-hidden rounded-2xl bg-child-surface shadow-lg">
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={`Scene ${scene.sceneOrder}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/5">
                    <span className="text-6xl">
                      {["🌟", "🌈", "🦊", "🌙", "🌻"][scene.sceneOrder % 5]}
                    </span>
                  </div>
                )}
              </div>

              {/* Text snippet */}
              <div className="mt-3 rounded-xl bg-child-surface p-4 shadow">
                <p className="text-center text-base leading-relaxed">
                  {scene.textSnippet}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Completion screen overlay */}
      {isComplete && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-child-bg/95 p-8">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold mb-2">Great job!</h2>
          <p className="text-muted-foreground mb-8">You finished the episode!</p>
          <div className="flex gap-4">
            <button
              onClick={restart}
              className="flex items-center gap-2 rounded-full bg-child-surface px-6 py-3 font-medium shadow-lg"
            >
              <RotateCcw className="h-5 w-5" /> Listen Again
            </button>
            {nextEpisodeId ? (
              <button
                onClick={() =>
                  router.push(`/play/${childId}/${storyPackId}/${nextEpisodeId}`)
                }
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg"
              >
                Next Episode <SkipForward className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => router.push(`/play/${childId}`)}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg"
              >
                <Home className="h-5 w-5" /> Back Home
              </button>
            )}
          </div>
        </div>
      )}

      {/* Player Controls */}
      <div className="flex items-center justify-center gap-6 px-4 py-6 safe-area-inset">
        <button
          onClick={restart}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-child-surface shadow-lg"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
        <button
          onClick={togglePlay}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-xl"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 text-primary-foreground" fill="currentColor" />
          ) : (
            <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
          )}
        </button>
        <button
          onClick={() => goToScene(Math.min(scenes.length - 1, currentScene + 1))}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-child-surface shadow-lg"
        >
          <SkipForward className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
