"use client";

import { useCallback, useRef } from "react";

type SoundType = "tap" | "pop" | "success" | "sparkle" | "whoosh" | "unlock";

/**
 * Generates friendly UI sounds using Web Audio API.
 * No external audio files needed — all sounds are synthesized.
 */
export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new AudioCtx();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (type: SoundType) => {
      const ctx = getCtx();
      if (!ctx) return;

      // Resume context if suspended (iOS autoplay policy)
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      switch (type) {
        case "tap": {
          // Short wood-tap sound
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
        case "pop": {
          // Bubble pop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
        case "success": {
          // Two-note cheerful chime
          const notes = [523.25, 783.99]; // C5, G5
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            const start = now + i * 0.1;
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.3);
          });
          break;
        }
        case "sparkle": {
          // Ascending sparkle
          const notes = [659.25, 784, 987.77, 1318.51];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            const start = now + i * 0.06;
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.15);
          });
          break;
        }
        case "whoosh": {
          // Swipe whoosh (filtered noise)
          const bufferSize = ctx.sampleRate * 0.2;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.exponentialRampToValueAtTime(2000, now + 0.18);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          src.connect(filter).connect(gain).connect(ctx.destination);
          src.start(now);
          break;
        }
        case "unlock": {
          // Magical unlock arpeggio
          const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            const start = now + i * 0.08;
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.3);
          });
          break;
        }
      }

      // Haptic feedback: use native Capacitor haptics if available, else web vibrate
      triggerHaptic(type);
    },
    [getCtx]
  );

  return { play };
}

async function triggerHaptic(type: SoundType) {
  // Try native Capacitor haptics first
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).Capacitor) {
    try {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (type === "success" || type === "unlock") {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (type === "whoosh") {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
      return;
    } catch {}
  }

  // Fallback to web vibration
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const patterns: Record<SoundType, number | number[]> = {
      tap: 10,
      pop: 15,
      success: [15, 30, 15],
      sparkle: [10, 20, 10, 20, 10],
      whoosh: 8,
      unlock: [20, 40, 20, 40, 40],
    };
    try {
      navigator.vibrate(patterns[type]);
    } catch {}
  }
}
