"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronRight, Home } from "lucide-react";
import { RewardBadge } from "./reward-badge";
import { Mascot } from "./mascot";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";

interface CelebrationScreenProps {
  visible: boolean;
  episodeNumber: number;
  hasNextEpisode: boolean;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
}

const PRAISE = [
  "Amazing!",
  "Wonderful!",
  "You did it!",
  "Fantastic!",
  "Super star!",
  "Brilliant!",
];

const CONFETTI_EMOJIS = ["⭐", "🌟", "✨", "💫", "🎉", "🎊", "🌈"];

export const CelebrationScreen = React.memo(function CelebrationScreen({
  visible,
  episodeNumber,
  hasNextEpisode,
  onReplay,
  onNext,
  onHome,
}: CelebrationScreenProps) {
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();

  useEffect(() => {
    if (visible) {
      play("unlock");
      const phrase = PRAISE[episodeNumber % PRAISE.length];
      setTimeout(() => speak(`${phrase} You finished chapter ${episodeNumber}!`, { pitch: 1.3 }), 400);
    }
  }, [visible, episodeNumber, play, speak]);

  const praise = PRAISE[episodeNumber % PRAISE.length];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 safe-top safe-bottom bg-gradient-to-b from-child-primary via-indigo-500 to-purple-600 overflow-hidden"
        >
          {/* Confetti burst */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl pointer-events-none"
              initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
              animate={{
                y: -500 - Math.random() * 300,
                x: (Math.random() - 0.5) * 400,
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0.5],
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 1.5,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              style={{
                left: "50%",
                bottom: "20%",
              }}
            >
              {CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]}
            </motion.span>
          ))}

          {/* Mascot cheering */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
          >
            <Mascot mood="cheering" size={110} />
          </motion.div>

          {/* Badge */}
          <div className="my-2">
            <RewardBadge episodeNumber={episodeNumber} size={140} animate />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-4xl font-bold text-white mb-1 drop-shadow-lg"
          >
            {praise}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-lg text-white/90 mb-8"
          >
            Chapter {episodeNumber} unlocked!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="w-full max-w-xs space-y-3"
          >
            <button
              onClick={() => {
                play("pop");
                onReplay();
              }}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-white/20 backdrop-blur-sm px-6 py-4 text-lg font-semibold text-white transition-colors active:bg-white/30"
            >
              <RotateCcw className="h-5 w-5" />
              Listen Again
            </button>

            {hasNextEpisode ? (
              <button
                onClick={() => {
                  play("sparkle");
                  onNext();
                }}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-lg font-bold text-child-primary shadow-xl transition-colors active:bg-white/90"
              >
                Next Chapter
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  play("sparkle");
                  onHome();
                }}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-lg font-bold text-child-primary shadow-xl transition-colors active:bg-white/90"
              >
                <Home className="h-5 w-5" />
                All Done!
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
