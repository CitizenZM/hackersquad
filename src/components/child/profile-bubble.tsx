"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface ProfileBubbleProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  index: number;
  subtitle?: string;
}

const COLORS = [
  "from-blue-400 to-indigo-400",
  "from-pink-400 to-rose-400",
  "from-green-400 to-emerald-400",
  "from-amber-400 to-orange-400",
  "from-purple-400 to-violet-400",
  "from-cyan-400 to-teal-400",
];

function isEmojiAvatar(value: string) {
  return !value.startsWith("http") && !value.startsWith("/");
}

export function ProfileBubble({ id, name, avatarUrl, index, subtitle }: ProfileBubbleProps) {
  const color = COLORS[index % COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.12,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="flex flex-col items-center gap-3"
    >
      <Link href={`/play/${id}`} className="group">
        <motion.div
          whileTap={{ scale: 1.12 }}
          className="animate-float"
          style={{ animationDelay: `${index * 0.5}s` }}
        >
          <div
            className={`flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gradient-to-br ${color} shadow-lg shadow-black/10 ring-4 ring-white/50 transition-shadow group-active:shadow-xl`}
          >
            {avatarUrl && isEmojiAvatar(avatarUrl) ? (
              <span className="text-5xl">{avatarUrl}</span>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-white drop-shadow-sm">
                {name[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </motion.div>
        <p className="mt-1 text-center text-xl font-semibold text-foreground/80">
          {name}
        </p>
        {subtitle && (
          <p className="text-center text-xs text-foreground/40">{subtitle}</p>
        )}
      </Link>
    </motion.div>
  );
}
