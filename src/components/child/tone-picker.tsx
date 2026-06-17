"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STORYTELLER_TONES, type StorytellerTone } from "@/lib/hooks/use-voice-guide";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { ChevronDown } from "lucide-react";

interface TonePickerProps {
  tone: StorytellerTone;
  onChange: (tone: StorytellerTone) => void;
}

export function TonePicker({ tone, onChange }: TonePickerProps) {
  const [open, setOpen] = useState(false);
  const { play } = useSoundEffects();

  const current = STORYTELLER_TONES.find((t) => t.id === tone) || STORYTELLER_TONES[0];

  function pick(id: StorytellerTone) {
    play("pop");
    onChange(id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          play("tap");
          setOpen((o) => !o);
        }}
        aria-label="Change storyteller voice"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-2.5 py-1.5 shadow ring-1 ring-black/5 text-xs font-semibold"
      >
        <span className="text-base leading-none">{current.emoji}</span>
        <span className="text-foreground/70">{current.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-foreground/50 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click-away backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden"
            >
              <div className="px-3 py-2 border-b">
                <p className="text-xs font-bold text-foreground/60 uppercase tracking-wide">
                  Voice tone
                </p>
              </div>
              {STORYTELLER_TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pick(t.id)}
                  className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    t.id === tone
                      ? "bg-child-primary/10"
                      : "hover:bg-foreground/5"
                  }`}
                >
                  <span className="text-2xl leading-none mt-0.5">{t.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-[11px] text-foreground/50 leading-tight">
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
