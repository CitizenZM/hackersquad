"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide, STORYTELLER_TONES, type StorytellerTone } from "@/lib/hooks/use-voice-guide";
import { CelebrationScreen } from "./celebration-screen";
import { VocabCardDrawer } from "./vocab-card-drawer";
import { InteractiveScene } from "./interactive-scene";
import { TonePicker } from "./tone-picker";
import { ChevronLeft, RotateCcw, Play, Pause, SkipForward } from "lucide-react";

interface FlashcardScene {
  id: string;
  sceneOrder: number;
  imageUrl: string | null;
  textSnippet: string;
  duration: number | null;
  prompt?: string | null;
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
  defaultTone?: StorytellerTone;
  episodeTitle: string;
  episodeNumber: number;
  audioUrl: string | null;
  scenes: FlashcardScene[];
  vocabWords: VocabWord[];
  nextEpisodeId?: string;
  totalEpisodes: number;
}

const SCENE_EMOJIS = ["🌟", "🌈", "🦊", "🌙", "🌻", "🐻", "🦋", "🌸", "🐬", "🎈"];
const DEFAULT_SCENE_DURATION = 6; // seconds per scene when no audio

export function StoryPlayer({
  childId,
  storyPackId,
  episodeId,
  defaultTone,
  episodeTitle: _episodeTitle,
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
  const [tone, setTone] = useState<StorytellerTone>(defaultTone || "gentle");
  const progressRef = useRef<HTMLDivElement>(null);
  const { play: playSfx } = useSoundEffects();
  const { speakStory, stop: stopSpeech } = useVoiceGuide();

  const audio = useAudioPlayer(audioUrl);
  const hasAudio = !!audioUrl;

  // Fallback: voice-driven playback when no audio. Scenes advance when
  // the narration for the current scene finishes (with a small pause),
  // so the flashcard stays up as long as the voice is talking.
  const [timerPlaying, setTimerPlaying] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const speechCancelRef = useRef<(() => void) | null>(null);
  const allSceneDurations = scenes.map(
    (s) => s.duration || DEFAULT_SCENE_DURATION
  );
  const timerTotalDuration = allSceneDurations.reduce((a, d) => a + d, 0);

  // Clock that tracks roughly how much of the episode has elapsed, for
  // the progress bar. Resets when user scrubs or jumps scenes.
  useEffect(() => {
    if (hasAudio || !timerPlaying) return;
    const interval = setInterval(() => {
      setTimerElapsed((t) => {
        const next = t + 0.25;
        return next > timerTotalDuration ? timerTotalDuration : next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [hasAudio, timerPlaying, timerTotalDuration]);

  // Voice drives scene advance: when narration for the current scene
  // ends, snap the clock to the next scene's boundary and advance.
  useEffect(() => {
    if (hasAudio) return;
    if (!timerPlaying) {
      stopSpeech();
      speechCancelRef.current?.();
      speechCancelRef.current = null;
      return;
    }
    const snippet = scenes[currentScene]?.textSnippet;
    if (!snippet) return;

    let aborted = false;
    const cancel = speakStory(snippet, {
      tone,
      onComplete: () => {
        if (aborted) return;
        // Snap elapsed time to the end of the current scene
        const boundary = allSceneDurations
          .slice(0, currentScene + 1)
          .reduce((a, d) => a + d, 0);
        setTimerElapsed(boundary);

        if (currentScene < scenes.length - 1) {
          // Advance scene
          setCurrentScene(currentScene + 1);
          playSfx("whoosh");
          logEvent("FLASHCARD_VIEW");
        } else {
          // Last scene done → end playback, let celebration trigger
          setTimerPlaying(false);
        }
      },
    });
    speechCancelRef.current = cancel;

    return () => {
      aborted = true;
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene, timerPlaying, hasAudio, tone]);

  // Derived values that work for both audio + timer modes
  const isPlaying = hasAudio ? audio.isPlaying : timerPlaying;
  const currentTime = hasAudio ? audio.currentTime : timerElapsed;
  const duration = hasAudio ? audio.duration : timerTotalDuration;
  const progress = hasAudio ? audio.progress : duration > 0 ? timerElapsed / duration : 0;
  const hasEnded = hasAudio
    ? audio.hasEnded
    : !timerPlaying &&
      currentScene >= scenes.length - 1 &&
      timerElapsed >= timerTotalDuration - 0.5 &&
      timerTotalDuration > 0;

  function togglePlay() {
    if (hasAudio) {
      audio.togglePlay();
    } else {
      if (timerElapsed >= timerTotalDuration) {
        setTimerElapsed(0);
        setCurrentScene(0);
      }
      setTimerPlaying((p) => !p);
    }
  }

  function restart() {
    if (hasAudio) {
      audio.restart();
    } else {
      setTimerElapsed(0);
      setCurrentScene(0);
      setTimerPlaying(true);
    }
  }

  function seekToPercent(pct: number) {
    if (hasAudio) {
      audio.seekToPercent(pct);
    } else {
      setTimerElapsed(pct * timerTotalDuration);
    }
  }

  // Audio-mode: advance scenes based on audio timestamps.
  // (Voice-mode advances via speakStory's onComplete above.)
  useEffect(() => {
    if (!hasAudio || !isPlaying || scenes.length === 0 || duration === 0) return;

    let elapsed = 0;
    for (let i = 0; i < scenes.length; i++) {
      elapsed += scenes[i].duration || duration / scenes.length;
      if (currentTime < elapsed) {
        if (i !== currentScene) {
          setCurrentScene(i);
          playSfx("whoosh");
          logEvent("FLASHCARD_VIEW");
        }
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, isPlaying, scenes, duration, hasAudio]);

  // Show celebration when playback ends
  useEffect(() => {
    if (hasEnded && !showCelebration) {
      logEvent("PLAY_COMPLETE");
      logEvent("EPISODE_COMPLETE");
      setShowCelebration(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEnded]);

  // Log episode start
  useEffect(() => {
    logEvent("EPISODE_START");
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const clamped = Math.max(0, Math.min(scenes.length - 1, index));
      setCurrentScene(clamped);
      if (!hasAudio) {
        // Sync timer to this scene's start
        let t = 0;
        for (let i = 0; i < clamped; i++) {
          t += scenes[i].duration || DEFAULT_SCENE_DURATION;
        }
        setTimerElapsed(t);
      }
    },
    [scenes, hasAudio]
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        goToScene(currentScene - 1);
      } else if (e.key === "ArrowRight") {
        goToScene(currentScene + 1);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Escape") {
        router.back();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene, goToScene]);

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

  // Scene boundary markers for progress bar
  const sceneMarkers: number[] = [];
  if (scenes.length > 1 && duration > 0) {
    let elapsed = 0;
    for (let i = 0; i < scenes.length - 1; i++) {
      elapsed += scenes[i].duration || duration / scenes.length;
      sceneMarkers.push(elapsed / duration);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-sky-100 via-violet-50 to-rose-100">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 safe-top safe-x">
        <button
          onClick={() => router.push(`/play/${childId}/${storyPackId}`)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {!hasAudio && <TonePicker tone={tone} onChange={setTone} />}
          <div className="rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 shadow">
            <span className="child-caption text-foreground/60">
              {episodeNumber}/{totalEpisodes}
            </span>
          </div>
        </div>
      </div>

      {/* Flashcard area — swipe to navigate, tap whitespace to play/pause */}
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
                className="absolute inset-0"
                onClick={(e) => e.stopPropagation()}
              >
                <InteractiveScene
                  sceneId={scene.id}
                  sceneOrder={scene.sceneOrder}
                  imageUrl={scene.imageUrl}
                  textSnippet={scene.textSnippet}
                  promptMetadata={scene.prompt ?? null}
                  fallbackEmoji={
                    SCENE_EMOJIS[scene.sceneOrder % SCENE_EMOJIS.length]
                  }
                />
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
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-child-primary transition-all duration-200"
              style={{ width: `${progress * 100}%` }}
            />
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
              playSfx("tap");
              goToScene(Math.max(0, currentScene - 1));
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md active:scale-90 transition-transform"
          >
            <RotateCcw className="h-6 w-6 text-foreground/60" />
          </button>

          <button
            onClick={() => {
              playSfx("pop");
              const wasPlaying = isPlaying;
              togglePlay();
              if (wasPlaying) logEvent("PLAY_PAUSE");
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
            onClick={() => {
              playSfx("tap");
              goToScene(Math.min(scenes.length - 1, currentScene + 1));
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md active:scale-90 transition-transform"
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
