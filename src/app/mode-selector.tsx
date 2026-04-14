"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mascot } from "@/components/child/mascot";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { Sparkles, ShieldCheck } from "lucide-react";

export function ModeSelector() {
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();

  useEffect(() => {
    // Voice greeting after first user interaction
    function onFirstTap() {
      speak("Welcome to StoryNest!", { pitch: 1.2 });
      window.removeEventListener("pointerdown", onFirstTap);
    }
    window.addEventListener("pointerdown", onFirstTap);
    return () => window.removeEventListener("pointerdown", onFirstTap);
  }, [speak]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-8 safe-top safe-bottom bg-gradient-to-b from-sky-100 via-purple-50 to-rose-100 overflow-hidden">
      {/* Floating background */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl opacity-30 pointer-events-none"
          style={{
            left: `${8 + ((i * 13) % 84)}%`,
            top: `${10 + ((i * 19) % 75)}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.4,
          }}
        >
          {["⭐", "✨", "☁️", "🌙", "💫", "🎈", "🌈", "🦋"][i]}
        </motion.div>
      ))}

      {/* Mascot */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mb-4"
      >
        <Mascot
          mood="waving"
          size={140}
          onTap={() => {
            play("pop");
            speak("Hi! I'm Nesty! Pick a mode to start!");
          }}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-4xl font-bold text-child-primary mb-2"
      >
        StoryNest
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="child-body text-foreground/50 mb-10 text-center"
      >
        Pick a mode to start
      </motion.p>

      {/* Mode buttons */}
      <div className="w-full max-w-sm space-y-4">
        {/* Kid Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <Link
            href="/play"
            onClick={() => {
              play("sparkle");
              speak("Let's read some stories!", { pitch: 1.3 });
            }}
          >
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 p-6 shadow-xl shadow-orange-300/40"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 backdrop-blur">
                <Sparkles className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-2xl font-bold text-white">Kid Mode</p>
                <p className="text-sm text-white/80">Listen to stories</p>
              </div>
              <div className="text-3xl">🦊</div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Parent Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, type: "spring" }}
        >
          <Link
            href="/parent-access"
            onClick={() => play("tap")}
          >
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-4 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-foreground/5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-child-primary/10">
                <ShieldCheck className="h-7 w-7 text-child-primary" strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xl font-bold text-foreground">Parent Mode</p>
                <p className="text-sm text-foreground/50">Create stories &amp; see progress</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5">
                <span className="text-lg">🔒</span>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
