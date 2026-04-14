"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ProfileBubble } from "@/components/child/profile-bubble";
import { Mascot } from "@/components/child/mascot";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";

interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export function ProfileSelector({ profiles }: { profiles: Profile[] }) {
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();
  const [greeted, setGreeted] = useState(false);

  // Voice greeting after first user interaction
  useEffect(() => {
    function onFirstTap() {
      if (greeted) return;
      setGreeted(true);
      play("sparkle");
      setTimeout(() => {
        speak("Hello! Who's ready for a story today?");
      }, 300);
      window.removeEventListener("pointerdown", onFirstTap);
    }
    window.addEventListener("pointerdown", onFirstTap);
    return () => window.removeEventListener("pointerdown", onFirstTap);
  }, [greeted, play, speak]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 safe-top safe-bottom bg-gradient-to-b from-sky-100 via-blue-50 to-violet-100 overflow-hidden">
      {/* Floating background stars */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-30 pointer-events-none"
          style={{
            left: `${10 + ((i * 17) % 80)}%`,
            top: `${15 + ((i * 23) % 60)}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          {["⭐", "✨", "☁️", "🌙", "💫", "🎈"][i]}
        </motion.div>
      ))}

      {/* Mascot greeting */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mb-2"
      >
        <Mascot
          mood="waving"
          size={120}
          onTap={() => {
            play("pop");
            speak("Hi there! I'm Nesty!");
          }}
        />
      </motion.div>

      {/* Speech bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="relative mb-8 rounded-3xl bg-white px-5 py-3 shadow-md"
      >
        <p className="child-title text-child-primary">Who&apos;s listening?</p>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 rotate-45 bg-white" />
      </motion.div>

      {profiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="child-body text-foreground/40">No profiles yet!</p>
          <p className="child-caption text-foreground/30 mt-1">
            Ask a parent to create one.
          </p>
        </motion.div>
      ) : (
        <div
          className="flex flex-wrap justify-center gap-8 max-w-md"
          onClickCapture={() => play("tap")}
        >
          {profiles.map((child, i) => (
            <ProfileBubble
              key={child.id}
              id={child.id}
              name={child.name}
              avatarUrl={child.avatarUrl}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
