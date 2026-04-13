"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { CelebrationScreen } from "./celebration-screen";
import { VocabCardDrawer } from "./vocab-card-drawer";
import { ChevronLeft, RotateCcw, Play, Pause, SkipForward } from "lucide-react";

interface FlashcardScene {
  id: string;
  sceneOrder: number;
  imageUrl: string | null;
  textSnippet: string;
  duration: number | null;
}

interface VocabWord {
  id: string;
  word: string;
  definition: string;
  example?: string | null;
  imageUrl?: string | null;
}

interface StoryPlayerProps {
  childId: string;
  storyPackId: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  audioUrl: string | null;
  scenes: FlashcardScene[];
  vocabWords: VocabWord[];
  nextEpisodeId?: string;
  totalEpisodes: number;
}

const SCENE_EMOJIS = ["🌟", "🌈", "🦊", "🌙", "🌻", "🐻", "🦋", "🌸", "🐬", "🎈"];

export function StoryPlayer({
  childId,
  storyPackId,
  episodeId,
  episodeTitle,
  episodeNumber,
  audioUrl,
  scenes,
  vocabWords,
  nextEpisodeId,
  totalEpisodes,
}: StoryPlayerProps) {
  const router = useRouter();
  const [currentScene, setCurrentScene] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const {
    isPlaying,
    currentTime,
    duration,
    progress,
    hasEnded,
    togglePlay,
    restart,
    seekToPercent,
  } = useAudioPlayer(audioUrl);

  // Auto-advance scenes based on timing
  useEffect(() => {
    if (!isPlaying || scenes.length === 0 || duration === 0) return;

    let elapsed = 0;
    for (let i = 0; i < scenes.length; i++) {
      elapsed += scenes[i].duration || duration / scenes.length;
      if (currentTime < elapsed) {
        if (i !== currentScene) {
          setCurrentScene(i);
          logEvent("FLASHCARD_VIEW");
        }
        break;
      }
    }
  }, [currentTime, isPlaying, scenes, duration, currentScene]);

  // Show celebration when audio ends
  useEffect(() => {
    if (hasEnded && !showCelebration) {
      logEvent("PLAY_COMPLETE");
      logEvent("EPISODE_COMPLETE");
      setShowCelebration(true);
    }
  }, [hasEnded, showCelebration]);

  // Log episode start
  useEffect(() => {
    logEvent("EPISODE_START");
  }, []);

  function logEvent(eventType: string) {
    fetch("/api/play/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childProfileId: childId,
        storyPackId,
        episodeId,
        eventType,
      }),
    }).catch(() => {});
  }

  const goToScene = useCallback(
    (index: number) => {
      setCurrentScene(Math.max(0, Math.min(scenes.length - 1, index)));
    },
    [scenes.length]
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToScene(currentScene + 1),
    onSwipedRight: () => goToScene(currentScene - 1),
    trackMouse: true,
  });

  function handleProgressTap(e: React.MouseEvent | React.TouchEvent) {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekToPercent(pct);
  }

  function handleReplay() {
    setShowCelebration(false);
    restart();
  }

  function handleNext() {
    if (nextEpisodeId) {
      router.push(`/play/${childId}/${storyPackId}/${nextEpisodeId}`);
    }
  }

  function handleHome() {
    router.push(`/play/${childId}`);
  }

  function handleCelebrationNext() {
    if (vocabWords.length > 0) {
      setShowCelebration(false);
      setShowVocab(true);
    } else {
      handleNext();
    }
  }

  function handleCelebrationHome() {
    if (vocabWords.length > 0) {
      setShowCelebration(false);
      setShowVocab(true);
    } else {
      handleHome();
    }
  }

  const scene = scenes[currentScene];

  // Calculate scene boundary markers for progress bar
  const sceneMarkers: number[] = [];
  if (scenes.length > 1 && duration > 0) {
    let elapsed = 0;
    for (let i = 0; i < scenes.length - 1; i++) {
      elapsed += scenes[i].duration || duration / scenes.length;
      sceneMarkers.push(elapsed / duration);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-child-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 safe-top safe-x">
        <button
          onClick={() => router.push(`/play/${childId}/${storyPackId}`)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-child-surface/80 backdrop-blur-sm shadow"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="rounded-full bg-child-surface/80 backdrop-blur-sm px-3 py-1.5 shadow">
          <span className="child-caption text-foreground/60">
            {episodeNumber}/{totalEpisodes}
          </span>
        </div>
      </div>

      {/* Flashcard area */}
      <div className="flex-1 flex flex-col px-4 pb-2" {...swipeHandlers}>
        <div className="flex-1 relative" onClick={togglePlay}>
          <AnimatePresence mode="wait">
            {scene && (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Image */}
                <div className="flex-1 overflow-hidden rounded-3xl bg-child-surface shadow-lg">
                  {scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt={`Scene ${scene.sceneOrder}`}
                      className="h-full w-full object-contain bg-gradient-to-b from-sky-50 to-violet-50"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 via-violet-50 to-rose-100">
                      <span className="text-8xl">
                        {SCENE_EMOJIS[scene.sceneOrder % SCENE_EMOJIS.length]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Text overlay */}
                <div className="mt-3 rounded-2xl bg-white/80 backdrop-blur-xl p-4 shadow-sm">
                  <p className="child-body text-center text-foreground/80 line-clamp-3">
                    {scene.textSnippet}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 safe-x">
        <div
          ref={progressRef}
          onClick={handleProgressTap}
          className="relative h-11 flex items-center cursor-pointer"
        >
          <div className="relative w-full h-1.5 rounded-full bg-foreground/10">
            {/* Filled progress */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-child-primary transition-all duration-200"
              style={{ width: `${progress * 100}%` }}
            />
            {/* Scene markers */}
            {sceneMarkers.map((pos, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 h-2.5 w-0.5 bg-foreground/20 rounded-full"
                style={{ left: `${pos * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 safe-bottom safe-x">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => {
              goToScene(Math.max(0, currentScene - 1));
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-child-surface shadow-md active:scale-90 transition-transform"
          >
            <RotateCcw className="h-6 w-6 text-foreground/60" />
          </button>

          <button
            onClick={() => {
              togglePlay();
              if (isPlaying) logEvent("PLAY_PAUSE");
              else logEvent("PLAY_RESUME");
            }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-child-primary shadow-xl shadow-child-primary/30 active:scale-90 transition-transform"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white" fill="white" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1" fill="white" />
            )}
          </button>

          <button
            onClick={() => goToScene(Math.min(scenes.length - 1, currentScene + 1))}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-child-surface shadow-md active:scale-90 transition-transform"
          >
            <SkipForward className="h-6 w-6 text-foreground/60" />
          </button>
        </div>

        <p className="text-center child-caption text-foreground/40 mt-2">
          Scene {currentScene + 1} of {scenes.length}
        </p>
      </div>

      {/* Celebration overlay */}
      <CelebrationScreen
        visible={showCelebration}
        episodeNumber={episodeNumber}
        hasNextEpisode={!!nextEpisodeId}
        onReplay={handleReplay}
        onNext={handleCelebrationNext}
        onHome={handleCelebrationHome}
      />

      {/* Vocab drawer */}
      <VocabCardDrawer
        visible={showVocab}
        words={vocabWords}
        onClose={() => {
          setShowVocab(false);
          if (nextEpisodeId) handleNext();
          else handleHome();
        }}
      />
    </div>
  );
}
