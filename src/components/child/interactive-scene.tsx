"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  detectTheme,
  parseSceneMetadata,
  SCENE_THEMES,
  SceneTheme,
  SceneMetadata,
} from "@/lib/scene-themes";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { CartoonScene } from "./cartoon-scene";

interface InteractiveSceneProps {
  sceneId: string;
  sceneOrder: number;
  imageUrl: string | null;
  textSnippet: string;
  promptMetadata: string | null; // JSON in FlashcardScene.prompt
  fallbackEmoji: string;
}

const POSITION_CLASSES: Record<string, string> = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function InteractiveScene({
  sceneId,
  sceneOrder,
  imageUrl: _imageUrl, // reserved for future AI-generated imagery
  textSnippet,
  promptMetadata,
  fallbackEmoji,
}: InteractiveSceneProps) {
  const { play } = useSoundEffects();
  const { speak } = useVoiceGuide();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tappedHotspots, setTappedHotspots] = useState<Record<number, number>>({});

  const metadata: SceneMetadata | null = parseSceneMetadata(promptMetadata);
  const theme: SceneTheme = metadata?.theme || detectTheme(textSnippet);
  const themeConfig = SCENE_THEMES[theme];
  const character = metadata?.character;
  const hotspots = metadata?.hotspots || defaultHotspots(theme);

  // Device tilt parallax (gracefully no-op if not supported/permitted)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    function handleOrientation(e: DeviceOrientationEvent) {
      if (!active) return;
      const gamma = e.gamma || 0; // -90 to 90 (left-right)
      const beta = e.beta || 0; // -180 to 180 (front-back)
      // Convert to small pixel offsets, clamped
      setTilt({
        x: Math.max(-8, Math.min(8, gamma / 6)),
        y: Math.max(-8, Math.min(8, (beta - 45) / 6)),
      });
    }

    // iOS 13+ requires explicit permission; skip silently if it fails
    type DOEWithPerm = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    const DOE = (typeof DeviceOrientationEvent !== "undefined"
      ? DeviceOrientationEvent
      : null) as DOEWithPerm | null;

    if (DOE && typeof DOE.requestPermission === "function") {
      // Do nothing automatically — needs user gesture. Stay at 0,0.
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      active = false;
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Reset tapped state on scene change
  useEffect(() => {
    setTappedHotspots({});
  }, [sceneId]);

  function onHotspotTap(idx: number, hotspot: NonNullable<SceneMetadata["hotspots"]>[number]) {
    play(hotspot.sound || "sparkle");
    setTappedHotspots((t) => ({ ...t, [idx]: (t[idx] || 0) + 1 }));
    if (hotspot.reaction) {
      // Delay slightly so the sound lands first
      setTimeout(() => speak(hotspot.reaction!, { tone: "excited" }), 120);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Image/backdrop with overlay interactions */}
      <div
        className={`relative flex-1 overflow-hidden rounded-3xl shadow-lg bg-gradient-to-br ${themeConfig.gradient}`}
      >
        {/* Cartoon SVG backdrop — always drawn, matches design system */}
        <CartoonScene
          theme={theme}
          sceneOrder={sceneOrder}
          character={character?.emoji || fallbackEmoji}
          characterPosition={character?.position || "bottom-right"}
        />

        {/* Soft top/bottom vignette so overlays read better */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />

        {/* Ambient particle layer (parallax-shifted) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0)`,
            transition: "transform 0.15s linear",
          }}
        >
          {themeConfig.particles.flatMap((p, pi) =>
            Array.from({ length: 3 }).map((_, i) => {
              const key = `${p}-${pi}-${i}`;
              const left = 8 + ((pi * 29 + i * 37) % 84);
              const top = 10 + ((pi * 23 + i * 41) % 70);
              const delay = (pi * 0.8 + i * 1.1) % 4;
              const duration = 5 + ((pi + i) % 4);
              return (
                <motion.span
                  key={key}
                  className="absolute text-2xl opacity-60 select-none drop-shadow-sm"
                  style={{ left: `${left}%`, top: `${top}%` }}
                  animate={{
                    y: [0, -18, 0],
                    x: [0, 4, -4, 0],
                    rotate: [0, 8, -8, 0],
                  }}
                  transition={{
                    duration,
                    repeat: Infinity,
                    delay,
                    ease: "easeInOut",
                  }}
                >
                  {p}
                </motion.span>
              );
            })
          )}
        </div>

        {/* Tappable hotspots */}
        {hotspots.map((h, idx) => {
          const pos = POSITION_CLASSES[h.position || (idx === 0 ? "top-right" : "bottom-left")];
          const tapCount = tappedHotspots[idx] || 0;
          return (
            <motion.button
              key={`${sceneId}-hot-${idx}`}
              aria-label={h.reaction}
              onClick={(e) => {
                e.stopPropagation();
                onHotspotTap(idx, h);
              }}
              className={`absolute ${pos} flex h-16 w-16 items-center justify-center rounded-full bg-white/40 backdrop-blur-md shadow-lg ring-2 ring-white/60 active:scale-90 transition-transform`}
              initial={{ scale: 0, rotate: -20 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: [0, -8, 0],
              }}
              transition={{
                scale: { type: "spring", stiffness: 240, damping: 15, delay: 0.3 + idx * 0.15 },
                rotate: { type: "spring", stiffness: 240, damping: 15, delay: 0.3 + idx * 0.15 },
                y: { duration: 2.5 + idx * 0.3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 },
              }}
              whileTap={{ scale: 0.85 }}
            >
              <motion.span
                key={tapCount}
                initial={tapCount > 0 ? { scale: 1.4, rotate: 360 } : { scale: 1 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="text-3xl leading-none select-none"
              >
                {h.emoji}
              </motion.span>
            </motion.button>
          );
        })}
      </div>

      {/* Text snippet card */}
      <div className="mt-3 rounded-2xl bg-white/90 backdrop-blur-xl p-4 shadow-sm">
        <p className="child-body text-center text-foreground/80">{textSnippet}</p>
      </div>
    </div>
  );
}

/**
 * Sensible default hotspots when no metadata is provided —
 * pulled from the theme's own particle set so they still feel in-scene.
 */
function defaultHotspots(
  theme: SceneTheme
): NonNullable<SceneMetadata["hotspots"]> {
  const particles = SCENE_THEMES[theme].particles;
  const sounds: Array<"sparkle" | "pop" | "whoosh"> = ["sparkle", "pop", "whoosh"];
  const positions: Array<"top-right" | "bottom-left"> = ["top-right", "bottom-left"];
  return particles.slice(0, 2).map((emoji, i) => ({
    emoji,
    sound: sounds[i % sounds.length],
    position: positions[i],
  }));
}
