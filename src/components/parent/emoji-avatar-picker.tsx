"use client";

import { useState } from "react";

const AVATAR_EMOJIS = [
  "🐻", "🦊", "🐰", "🐱", "🐶", "🐼", "🦁", "🐸",
  "🦋", "🐬", "🦄", "🐧", "🐥", "🐝", "🌟", "🌈",
  "🚀", "👸", "🤴", "🧙", "🦸", "🎨", "📚", "🎵",
];

interface EmojiAvatarPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiAvatarPicker({ value, onChange }: EmojiAvatarPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
          {value || "🐻"}
        </div>
        <span className="text-sm text-muted-foreground">
          Pick an avatar for your child
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {AVATAR_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
              value === emoji
                ? "bg-primary/20 ring-2 ring-primary scale-110"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
