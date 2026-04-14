"use client";

import { motion } from "framer-motion";

interface RewardBadgeProps {
  episodeNumber: number;
  size?: number;
  animate?: boolean;
}

const BADGE_COLORS = [
  ["#FFD54F", "#FFA726"], // gold
  ["#81D4FA", "#0288D1"], // blue
  ["#F48FB1", "#EC407A"], // pink
  ["#A5D6A7", "#43A047"], // green
  ["#CE93D8", "#8E24AA"], // purple
  ["#FFAB91", "#E64A19"], // orange
];

export function RewardBadge({ episodeNumber, size = 140, animate = false }: RewardBadgeProps) {
  const [c1, c2] = BADGE_COLORS[(episodeNumber - 1) % BADGE_COLORS.length];
  const id = `grad-${episodeNumber}`;

  return (
    <motion.div
      initial={animate ? { scale: 0, rotate: -180 } : { scale: 1 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 14, delay: animate ? 0.3 : 0 }}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <radialGradient id={id} cx="50%" cy="40%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </radialGradient>
        </defs>

        {/* Starburst outer */}
        <g transform="translate(100,100)">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.rect
              key={i}
              x="-6"
              y="-92"
              width="12"
              height="20"
              fill={c1}
              transform={`rotate(${i * 30})`}
              initial={animate ? { opacity: 0, scaleY: 0 } : {}}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.5 + i * 0.03 }}
            />
          ))}
        </g>

        {/* Main circle */}
        <circle cx="100" cy="100" r="70" fill={`url(#${id})`} stroke="white" strokeWidth="4" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />

        {/* Star center */}
        <motion.path
          d="M100 55 L110 85 L142 85 L116 105 L126 135 L100 117 L74 135 L84 105 L58 85 L90 85 Z"
          fill="white"
          initial={animate ? { scale: 0, rotate: 360 } : {}}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          style={{ transformOrigin: "100px 100px" }}
        />

        {/* Episode number */}
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fontSize="28"
          fontWeight="bold"
          fill={c2}
        >
          {episodeNumber}
        </text>
      </svg>
    </motion.div>
  );
}
