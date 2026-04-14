"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Uses Web Speech Synthesis API to speak prompts to young children.
 * Falls back silently if not supported.
 */
export function useVoiceGuide() {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      // Prefer child-friendly voices (higher-pitched names) or English female
      const preferred =
        voices.find((v) => /samantha|victoria|tessa|moira/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (preferred) voiceRef.current = preferred;
    }

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.rate = opts?.rate ?? 0.95;
        utterance.pitch = opts?.pitch ?? 1.15;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      } catch {
        // ignore
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
