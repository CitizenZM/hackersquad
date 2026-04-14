"use client";

import { useCallback, useRef, useEffect } from "react";

export type Tone =
  | "ui"
  | "narrator"
  | "character"
  | "excited"
  // Childish storytelling tones
  | "bedtime"
  | "playful"
  | "gentle";

export type StorytellerTone = "bedtime" | "playful" | "gentle";

interface ToneSettings {
  rate: number;
  pitch: number;
  volume: number;
  // Optional character pitch override when inside "quotes"
  characterPitch?: number;
}

const TONES: Record<Tone, ToneSettings> = {
  ui: { rate: 0.95, pitch: 1.15, volume: 0.8 },
  narrator: { rate: 0.88, pitch: 1.05, volume: 0.85 },
  character: { rate: 1.0, pitch: 1.35, volume: 0.85 },
  excited: { rate: 1.05, pitch: 1.25, volume: 0.9 },

  // Bedtime — slow, soft, soothing. Low volume, longer sentences feel calm.
  bedtime: { rate: 0.82, pitch: 1.0, volume: 0.72, characterPitch: 1.2 },

  // Playful — bouncy, bright, a little faster. Great for entertainment.
  playful: { rate: 1.0, pitch: 1.3, volume: 0.9, characterPitch: 1.55 },

  // Gentle — warm, clear, balanced. A storyteller-aunt tone.
  gentle: { rate: 0.9, pitch: 1.15, volume: 0.85, characterPitch: 1.4 },
};

export const STORYTELLER_TONES: Array<{
  id: StorytellerTone;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    id: "gentle",
    label: "Gentle",
    description: "Warm, clear, balanced — perfect for every story",
    emoji: "🌿",
  },
  {
    id: "playful",
    label: "Playful",
    description: "Bouncy, bright, full of wonder",
    emoji: "🎉",
  },
  {
    id: "bedtime",
    label: "Bedtime",
    description: "Slow, soft, soothing — for sleepy eyes",
    emoji: "🌙",
  },
];

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
    (
      text: string,
      opts?: { onComplete?: () => void; tone?: StorytellerTone }
    ): (() => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        opts?.onComplete?.();
        return () => {};
      }
      let cancelled = false;
      let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

      // Pick the base storyteller tone (narrator-like). Prose uses this
      // tone; inside "quotes" we switch to a higher-pitched character
      // voice derived from the base tone.
      const baseToneId: Tone = opts?.tone || "narrator";
      const baseTone = TONES[baseToneId];
      const dialogueTone: ToneSettings = {
        rate: baseTone.rate + 0.08,
        pitch: baseTone.characterPitch || baseTone.pitch + 0.3,
        volume: Math.min(1, baseTone.volume + 0.05),
      };

      // Bedtime tone gets longer sentence pauses for soothing cadence.
      const sentencePause = baseToneId === "bedtime" ? 360 : baseToneId === "playful" ? 140 : 200;

      try {
        window.speechSynthesis.cancel();

        const sentences = text
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

        const chunks: { text: string; settings: ToneSettings }[] = [];
        for (const s of sentences) {
          const parts = s.split(/("[^"]*"|'[^']*')/g).filter(Boolean);
          for (const p of parts) {
            const trimmed = p.trim();
            if (!trimmed) continue;
            const isQuoted = /^["'].*["']$/.test(trimmed);
            chunks.push({
              text: isQuoted ? trimmed.replace(/^["']|["']$/g, "") : trimmed,
              settings: isQuoted ? dialogueTone : baseTone,
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
          const u = new SpeechSynthesisUtterance(chunk.text);
          if (voiceRef.current) u.voice = voiceRef.current;
          u.rate = chunk.settings.rate;
          u.pitch = chunk.settings.pitch;
          u.volume = chunk.settings.volume;
          u.onend = () => {
            if (cancelled) return;
            pendingTimeout = setTimeout(speakNext, sentencePause);
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
