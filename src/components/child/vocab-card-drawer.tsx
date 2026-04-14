"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { Sparkles, X, Volume2 } from "lucide-react";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";

interface VocabWord {
  id: string;
  word: string;
  definition: string;
  example?: string | null;
  imageUrl?: string | null;
}

interface VocabCardDrawerProps {
  visible: boolean;
  words: VocabWord[];
  onClose: () => void;
}

const CARD_COLORS = [
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-emerald-400 to-green-500",
  "from-amber-400 to-orange-500",
  "from-violet-400 to-purple-500",
  "from-cyan-400 to-teal-500",
];

export function VocabCardDrawer({ visible, words, onClose }: VocabCardDrawerProps) {
  const [current, setCurrent] = useState(0);
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();

  useEffect(() => {
    if (visible && words.length > 0) {
      play("sparkle");
      setTimeout(() => speak("Let's learn some new words!", { pitch: 1.2 }), 400);
    }
  }, [visible, words.length, play, speak]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      play("whoosh");
      setCurrent((c) => Math.min(words.length - 1, c + 1));
    },
    onSwipedRight: () => {
      play("whoosh");
      setCurrent((c) => Math.max(0, c - 1));
    },
    trackMouse: true,
  });

  function speakWord() {
    if (!words[current]) return;
    play("pop");
    speak(`${words[current].word}. ${words[current].definition}`, { pitch: 1.2 });
  }

  if (words.length === 0) return null;

  const word = words[current];
  const color = CARD_COLORS[current % CARD_COLORS.length];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0 z-30 flex flex-col bg-child-bg safe-top"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-child-accent" />
              New Words!
            </h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-child-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Card area */}
          <div className="flex-1 flex items-center justify-center px-6" {...handlers}>
            <AnimatePresence mode="wait">
              <motion.div
                key={word.id}
                onClick={speakWord}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                className={`relative w-full max-w-[300px] rounded-3xl bg-gradient-to-br ${color} p-6 shadow-xl cursor-pointer`}
              >
                <div className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Volume2 className="h-4 w-4 text-white" />
                </div>
                {word.imageUrl && (
                  <img
                    src={word.imageUrl}
                    alt={word.word}
                    className="mx-auto mb-4 h-28 w-28 rounded-2xl object-cover shadow-md"
                  />
                )}
                <h3 className="text-center text-3xl font-bold text-white mb-3">
                  {word.word}
                </h3>
                <p className="text-center text-base text-white/90 mb-3">
                  {word.definition}
                </p>
                {word.example && (
                  <p className="text-center text-sm italic text-white/70">
                    &ldquo;{word.example}&rdquo;
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots + Done */}
          <div className="px-6 pb-6 safe-bottom space-y-4">
            {/* Dots */}
            <div className="flex justify-center gap-2">
              {words.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === current ? "w-7 bg-child-primary" : "w-2.5 bg-child-primary/30"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-full bg-child-primary py-4 text-lg font-semibold text-white shadow-lg active:bg-child-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
