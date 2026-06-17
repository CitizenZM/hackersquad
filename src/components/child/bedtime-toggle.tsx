"use client";

import { motion } from "framer-motion";
import { useBedtimeMode } from "@/lib/hooks/use-bedtime-mode";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";

export function BedtimeToggle() {
  const { isBedtime, toggleBedtime } = useBedtimeMode();
  const { play } = useSoundEffects();

  return (
    <motion.button
      onClick={() => {
        toggleBedtime();
        play(isBedtime ? "sparkle" : "tap");
      }}
      whileTap={{ scale: 0.9 }}
      className="flex items-center gap-2 rounded-full bg-child-surface px-4 py-2 shadow-md"
      aria-label={isBedtime ? "Exit bedtime mode" : "Enter bedtime mode"}
    >
      <span className="text-xl">{isBedtime ? "☀️" : "🌙"}</span>
      <span className="child-caption">{isBedtime ? "Day" : "Bedtime"}</span>
    </motion.button>
  );
}
