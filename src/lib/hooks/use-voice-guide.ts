"use client";

import { useCallback, useRef, useEffect } from "react";

type Tone = "ui" | "narrator" | "character" | "excited";

interface ToneSettings {
  rate: number;
  pitch: number;
  volume: number;
}

const TONES: Record<Tone, ToneSettings> = {
  ui: { rate: 0.95, pitch: 1.15, volume: 0.8 },
  narrator: { rate: 0.88, pitch: 1.05, volume: 0.85 },
  character: { rate: 1.0, pitch: 1.35, volume: 0.85 },
  excited: { rate: 1.05, pitch: 1.25, volume: 0.9 },
};

/**
 * Uses Web Speech Synthesis API with storytelling tone presets.
 *
 * - `speak(text, opts?)` — single utterance (backwards compatible)
 * - `speakStory(text)` — breaks text into sentences, uses narrator tone for prose
 *   and character tone for quoted dialogue, with natural pauses between sentences.
 */
export function useVoiceGuide() {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      // Prefer warm/female voices good for storytelling
      const preferred =
        voices.find((v) => /samantha|victoria|tessa|moira|karen|fiona/i.test(v.name)) ||
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
    (text: string, opts?: { rate?: number; pitch?: number; tone?: Tone }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const tone = opts?.tone ? TONES[opts.tone] : TONES.ui;
        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.rate = opts?.rate ?? tone.rate;
        utterance.pitch = opts?.pitch ?? tone.pitch;
        utterance.volume = tone.volume;
        window.speechSynthesis.speak(utterance);
      } catch {
        // ignore
      }
    },
    []
  );

  /**
   * Speak a passage with storytelling tone. Returns a `cancel` function.
   * - Splits on sentence boundaries (. ! ?)
   * - Detects quoted dialogue ("…" or '…') and uses `character` tone for it
   * - Queues utterances one after another (onend chaining)
   * - Adds brief pauses (180ms) between sentences
   * - Fires `onComplete` when all chunks finish (not fired if cancelled)
   */
  const speakStory = useCallback(
    (text: string, opts?: { onComplete?: () => void }): (() => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        opts?.onComplete?.();
        return () => {};
      }
      let cancelled = false;
      let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

      try {
        window.speechSynthesis.cancel();

        const sentences = text
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

        const chunks: { text: string; tone: Tone }[] = [];
        for (const s of sentences) {
          const parts = s.split(/("[^"]*"|'[^']*')/g).filter(Boolean);
          for (const p of parts) {
            const trimmed = p.trim();
            if (!trimmed) continue;
            const isQuoted = /^["'].*["']$/.test(trimmed);
            chunks.push({
              text: isQuoted ? trimmed.replace(/^["']|["']$/g, "") : trimmed,
              tone: isQuoted ? "character" : "narrator",
            });
          }
        }

        if (chunks.length === 0) {
          opts?.onComplete?.();
          return () => {};
        }

        let i = 0;
        const speakNext = () => {
          if (cancelled) return;
          if (i >= chunks.length) {
            opts?.onComplete?.();
            return;
          }
          const chunk = chunks[i++];
          const tone = TONES[chunk.tone];
          const u = new SpeechSynthesisUtterance(chunk.text);
          if (voiceRef.current) u.voice = voiceRef.current;
          u.rate = tone.rate;
          u.pitch = tone.pitch;
          u.volume = tone.volume;
          u.onend = () => {
            if (cancelled) return;
            pendingTimeout = setTimeout(speakNext, 180);
          };
          u.onerror = () => {
            if (cancelled) return;
            pendingTimeout = setTimeout(speakNext, 50);
          };
          window.speechSynthesis.speak(u);
        };
        speakNext();
      } catch {
        opts?.onComplete?.();
      }

      return () => {
        cancelled = true;
        if (pendingTimeout) clearTimeout(pendingTimeout);
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      };
    },
    []
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }, []);

  return { speak, speakStory, stop };
}
