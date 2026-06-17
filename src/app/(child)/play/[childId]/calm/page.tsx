"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { ChevronLeft } from "lucide-react";

const BREATHING_PROMPTS = [
  { text: "Breathe in slowly...", emoji: "🌬️", duration: 4000 },
  { text: "Hold it gently...", emoji: "✨", duration: 3000 },
  { text: "Now breathe out...", emoji: "🍃", duration: 5000 },
];

const CALM_SOUNDS = [
  { label: "Rain", emoji: "🌧️" },
  { label: "Ocean", emoji: "🌊" },
  { label: "Birds", emoji: "🐦" },
  { label: "Wind", emoji: "💨" },
];

export default function CalmCornerPage() {
  const params = useParams<{ childId: string }>();
  const router = useRouter();
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();
  const [breathingStep, setBreathingStep] = useState(-1);
  const [breathing, setBreathing] = useState(false);

  useEffect(() => {
    speak("Welcome to the calm corner. Take a deep breath.", {
      tone: "bedtime",
    });
  }, [speak]);

  useEffect(() => {
    if (!breathing || breathingStep < 0) return;

    const step = BREATHING_PROMPTS[breathingStep % BREATHING_PROMPTS.length];
    speak(step.text, { tone: "bedtime" });

    const timer = setTimeout(() => {
      setBreathingStep((s) => {
        if (s >= 8) {
          setBreathing(false);
          speak("Great job. You feel calm and peaceful now.", {
            tone: "bedtime",
          });
          return -1;
        }
        return s + 1;
      });
    }, step.duration);

    return () => clearTimeout(timer);
  }, [breathingStep, breathing, speak]);

  function startBreathing() {
    play("sparkle");
    setBreathing(true);
    setBreathingStep(0);
  }

  const currentPrompt = breathing && breathingStep >= 0
    ? BREATHING_PROMPTS[breathingStep % BREATHING_PROMPTS.length]
    : null;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-indigo-100 via-purple-50 to-blue-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 safe-top">
        <button
          onClick={() => router.push(`/play/${params.childId}`)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="child-title text-indigo-800">Calm Corner</h1>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        {/* Breathing exercise */}
        <motion.div
          animate={
            breathing
              ? {
                  scale: currentPrompt?.text.includes("in")
                    ? [1, 1.3]
                    : currentPrompt?.text.includes("out")
                    ? [1.3, 1]
                    : [1.15, 1.15],
                }
              : { scale: 1 }
          }
          transition={{ duration: breathing ? 3 : 0.5, ease: "easeInOut" }}
          className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 shadow-xl"
        >
          <span className="text-6xl">
            {currentPrompt?.emoji || "🧘"}
          </span>
        </motion.div>

        {currentPrompt ? (
          <p className="child-body text-indigo-700 text-center animate-pulse">
            {currentPrompt.text}
          </p>
        ) : (
          <div className="text-center space-y-4">
            <p className="child-body text-indigo-700">
              {breathing ? "Well done! You feel calm now. 🌟" : "Let's breathe together"}
            </p>
            <button
              onClick={startBreathing}
              className="rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 px-8 py-4 child-body font-semibold text-white shadow-lg active:scale-95 transition-transform"
            >
              {breathingStep >= 0 ? "Try Again" : "Start Breathing"} 🌬️
            </button>
          </div>
        )}

        {/* Calm sounds */}
        <div className="w-full max-w-sm">
          <p className="child-caption text-indigo-600/60 text-center mb-3">
            Calm sounds
          </p>
          <div className="flex justify-center gap-4">
            {CALM_SOUNDS.map((sound) => (
              <button
                key={sound.label}
                onClick={() => {
                  play("sparkle");
                  speak(sound.label, { tone: "bedtime" });
                }}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/60 p-3 shadow-sm active:scale-95 transition-transform"
              >
                <span className="text-3xl">{sound.emoji}</span>
                <span className="text-xs text-indigo-600">{sound.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
