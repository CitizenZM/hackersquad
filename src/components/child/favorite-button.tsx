"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";

interface FavoriteButtonProps {
  storyPackId: string;
  childId: string;
  isFavorite: boolean;
}

export function FavoriteButton({ storyPackId, childId, isFavorite: initial }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(initial);
  const { play } = useSoundEffects();

  async function toggle() {
    const next = !favorite;
    setFavorite(next);
    play(next ? "sparkle" : "tap");

    await fetch("/api/play/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyPackId, childId, favorite: next }),
    }).catch(() => setFavorite(!next)); // revert on failure
  }

  return (
    <motion.button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      whileTap={{ scale: 1.3 }}
      className="absolute top-3 left-3 z-10"
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <span className="text-2xl drop-shadow-md">
        {favorite ? "❤️" : "🤍"}
      </span>
    </motion.button>
  );
}
