"use client";

import { motion } from "framer-motion";

type MascotMood = "happy" | "waving" | "cheering" | "sleepy" | "curious";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  onTap?: () => void;
  className?: string;
}

/**
 * Nesty — a friendly owl mascot character.
 * SVG-based, animated, no external assets needed.
 */
export function Mascot({ mood = "happy", size = 140, onTap, className = "" }: MascotProps) {
  const bounce = mood === "cheering" ? [0, -12, 0] : [0, -6, 0];
  const bounceDuration = mood === "cheering" ? 0.5 : 2.5;

  return (
    <motion.div
      onClick={onTap}
      animate={{ y: bounce }}
      transition={{ duration: bounceDuration, repeat: Infinity, ease: "easeInOut" }}
      whileTap={{ scale: 0.9 }}
      className={`inline-block cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="100" cy="125" rx="60" ry="55" fill="#8B6FE8" />
        <ellipse cx="100" cy="130" rx="42" ry="38" fill="#F5EFFF" />

        {/* Wings */}
        <motion.path
          d="M 45 115 Q 30 105, 35 130 Q 42 145, 55 135 Z"
          fill="#6B4FD4"
          animate={mood === "waving" ? { rotate: [0, -20, 0, -15, 0] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ originX: "80%", originY: "30%" }}
        />
        <motion.path
          d="M 155 115 Q 170 105, 165 130 Q 158 145, 145 135 Z"
          fill="#6B4FD4"
          animate={mood === "waving" ? { rotate: [0, 20, 0, 15, 0] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ originX: "20%", originY: "30%" }}
        />

        {/* Head */}
        <circle cx="100" cy="75" r="50" fill="#8B6FE8" />

        {/* Ear tufts */}
        <path d="M 65 40 L 58 22 L 75 38 Z" fill="#6B4FD4" />
        <path d="M 135 40 L 142 22 L 125 38 Z" fill="#6B4FD4" />

        {/* Face disk */}
        <ellipse cx="100" cy="82" rx="38" ry="35" fill="#FFF8E1" />

        {/* Eyes */}
        <circle cx="82" cy="75" r="12" fill="white" />
        <circle cx="118" cy="75" r="12" fill="white" />

        {mood === "sleepy" ? (
          <>
            <path d="M 72 75 Q 82 80, 92 75" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 108 75 Q 118 80, 128 75" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <motion.circle
              cx="82"
              cy="77"
              r="6"
              fill="#1a1a2e"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
              style={{ originY: "77px" }}
            />
            <motion.circle
              cx="118"
              cy="77"
              r="6"
              fill="#1a1a2e"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
              style={{ originY: "77px" }}
            />
            {/* Eye sparkle */}
            <circle cx="85" cy="74" r="2" fill="white" />
            <circle cx="121" cy="74" r="2" fill="white" />
          </>
        )}

        {/* Beak */}
        <path
          d={mood === "cheering" ? "M 92 95 L 100 108 L 108 95 Z" : "M 94 92 L 100 100 L 106 92 Z"}
          fill="#FFB74D"
        />

        {/* Cheeks */}
        <circle cx="72" cy="92" r="5" fill="#FFB4B4" opacity="0.6" />
        <circle cx="128" cy="92" r="5" fill="#FFB4B4" opacity="0.6" />

        {/* Belly feathers */}
        <circle cx="85" cy="115" r="4" fill="#E8DFFF" />
        <circle cx="100" cy="120" r="4" fill="#E8DFFF" />
        <circle cx="115" cy="115" r="4" fill="#E8DFFF" />

        {/* Feet */}
        <ellipse cx="85" cy="178" rx="8" ry="4" fill="#FFB74D" />
        <ellipse cx="115" cy="178" rx="8" ry="4" fill="#FFB74D" />

        {/* Sleepy Z */}
        {mood === "sleepy" && (
          <motion.text
            x="140"
            y="55"
            fontSize="24"
            fill="#8B6FE8"
            fontWeight="bold"
            animate={{ y: [55, 45, 55], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Z
          </motion.text>
        )}

        {/* Sparkle stars for cheering */}
        {mood === "cheering" &&
          [
            [30, 40],
            [170, 50],
            [25, 90],
            [175, 100],
          ].map(([x, y], i) => (
            <motion.text
              key={i}
              x={x}
              y={y}
              fontSize="20"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            >
              ✨
            </motion.text>
          ))}
      </svg>
    </motion.div>
  );
}
