"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronRight, Home } from "lucide-react";

interface CelebrationScreenProps {
  visible: boolean;
  episodeNumber: number;
  hasNextEpisode: boolean;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
}

const STAR_EMOJIS = ["⭐", "🌟", "✨", "💫", "🎉"];

export function CelebrationScreen({
  visible,
  episodeNumber,
  hasNextEpisode,
  onReplay,
  onNext,
  onHome,
}: CelebrationScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-child-primary/90 to-indigo-600/90 px-8"
        >
          {/* Floating stars background */}
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-2xl pointer-events-none"
              style={{
                left: `${10 + (i * 7) % 80}%`,
                bottom: `-10%`,
                animation: `star-rise ${3 + (i % 3)}s linear ${i * 0.3}s infinite`,
              }}
            >
              {STAR_EMOJIS[i % STAR_EMOJIS.length]}
            </span>
          ))}

          {/* Main content */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="text-7xl mb-4"
          >
            🌟
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Amazing!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/80 mb-10"
          >
            Episode {episodeNumber} complete
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-xs space-y-3"
          >
            <button
              onClick={onReplay}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-white/20 backdrop-blur-sm px-6 py-4 text-lg font-semibold text-white transition-colors active:bg-white/30"
            >
              <RotateCcw className="h-5 w-5" />
              Listen Again
            </button>

            {hasNextEpisode ? (
              <button
                onClick={onNext}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-lg font-semibold text-child-primary shadow-lg transition-colors active:bg-white/90"
              >
                Next Episode
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={onHome}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-lg font-semibold text-child-primary shadow-lg transition-colors active:bg-white/90"
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
}
