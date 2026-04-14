"use client";

import { motion } from "framer-motion";
import type { SceneTheme } from "@/lib/scene-themes";

interface CartoonSceneProps {
  theme: SceneTheme;
  sceneOrder: number;
  character?: string;
  characterPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
}

/**
 * Hand-drawn style SVG scene — soft rounded shapes, warm pastels, no
 * sharp edges. Completely generated client-side, no external image
 * assets. Matches the design system's warm-cream + lavender palette.
 */
export function CartoonScene({
  theme,
  sceneOrder,
  character,
  characterPosition = "bottom-right",
}: CartoonSceneProps) {
  const charPos = characterPosition;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          {/* Sky gradients for each theme */}
          <linearGradient id={`sky-${theme}`} x1="0" y1="0" x2="0" y2="1">
            {getSkyStops(theme)}
          </linearGradient>
          <radialGradient id={`sun-${theme}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FFF5C2" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFCE4A" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id={`moon-${theme}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#DCE6FF" stopOpacity="0.7" />
          </radialGradient>
        </defs>

        {/* Sky/background */}
        <rect width="400" height="500" fill={`url(#sky-${theme})`} />

        {/* Theme-specific elements */}
        {renderThemeElements(theme, sceneOrder)}

        {/* Ground */}
        {renderGround(theme)}
      </svg>

      {/* Big character emoji overlay (animated) — bigger than the hotspots */}
      {character && (
        <motion.div
          className={`absolute ${POSITION_CLASS[charPos]}`}
          animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[6rem] leading-none drop-shadow-xl select-none">
            {character}
          </span>
        </motion.div>
      )}
    </div>
  );
}

const POSITION_CLASS = {
  "top-left": "top-6 left-6",
  "top-right": "top-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "bottom-right": "bottom-6 right-6",
};

function getSkyStops(theme: SceneTheme) {
  switch (theme) {
    case "night":
      return (
        <>
          <stop offset="0%" stopColor="#2B2552" />
          <stop offset="60%" stopColor="#4A3B7A" />
          <stop offset="100%" stopColor="#6B5BAA" />
        </>
      );
    case "forest":
      return (
        <>
          <stop offset="0%" stopColor="#E3F4DD" />
          <stop offset="70%" stopColor="#CCE8C0" />
          <stop offset="100%" stopColor="#A8D89A" />
        </>
      );
    case "water":
      return (
        <>
          <stop offset="0%" stopColor="#C9EEFA" />
          <stop offset="70%" stopColor="#9ED9F2" />
          <stop offset="100%" stopColor="#6FC4EA" />
        </>
      );
    case "meadow":
      return (
        <>
          <stop offset="0%" stopColor="#FFF6D1" />
          <stop offset="60%" stopColor="#FFE79A" />
          <stop offset="100%" stopColor="#C8E6A0" />
        </>
      );
    case "sky":
      return (
        <>
          <stop offset="0%" stopColor="#CAE4FF" />
          <stop offset="60%" stopColor="#E4D3FF" />
          <stop offset="100%" stopColor="#FFE0E6" />
        </>
      );
    case "magic":
      return (
        <>
          <stop offset="0%" stopColor="#FCE1FF" />
          <stop offset="60%" stopColor="#DDC8FF" />
          <stop offset="100%" stopColor="#B6A7FF" />
        </>
      );
    case "snow":
      return (
        <>
          <stop offset="0%" stopColor="#F3F7FF" />
          <stop offset="100%" stopColor="#DCE6F5" />
        </>
      );
    case "indoor":
      return (
        <>
          <stop offset="0%" stopColor="#FFEACC" />
          <stop offset="100%" stopColor="#F3C98E" />
        </>
      );
    default:
      return (
        <>
          <stop offset="0%" stopColor="#D8EBFF" />
          <stop offset="100%" stopColor="#F7E5F5" />
        </>
      );
  }
}

function renderThemeElements(theme: SceneTheme, sceneOrder: number) {
  const offset = (sceneOrder * 23) % 60;

  switch (theme) {
    case "night":
      return (
        <g>
          {/* Moon */}
          <circle cx="310" cy="80" r="42" fill={`url(#moon-night)`} />
          <circle cx="300" cy="72" r="38" fill="#FFF8E6" opacity="0.95" />
          {/* Stars */}
          {starField(20 + offset, "#FFF4C4")}
          {/* Distant hills */}
          <path
            d="M0 380 Q100 330 200 360 Q300 380 400 340 L400 500 L0 500 Z"
            fill="#2A2250"
            opacity="0.85"
          />
          <path
            d="M0 420 Q120 380 240 410 Q340 430 400 400 L400 500 L0 500 Z"
            fill="#1E1842"
          />
        </g>
      );
    case "forest":
      return (
        <g>
          {/* Sun */}
          <circle cx="320" cy="90" r="38" fill={`url(#sun-forest)`} />
          {/* Clouds */}
          {softCloud(80, 70, 1)}
          {softCloud(230, 55, 0.8)}
          {/* Tree canopies */}
          <path
            d="M0 380 Q50 320 110 360 Q160 340 210 370 Q260 345 320 370 Q370 350 400 380 L400 500 L0 500 Z"
            fill="#6DB96A"
          />
          <circle cx="60" cy="350" r="55" fill="#5FA85D" />
          <circle cx="160" cy="320" r="60" fill="#5FA85D" />
          <circle cx="260" cy="340" r="55" fill="#5FA85D" />
          <circle cx="360" cy="330" r="48" fill="#5FA85D" />
          {/* Flowers */}
          {flowerDot(50, 470, "#FFB4C6")}
          {flowerDot(130, 478, "#FFDA6B")}
          {flowerDot(210, 468, "#C79DFF")}
          {flowerDot(290, 480, "#FF9FA0")}
        </g>
      );
    case "water":
      return (
        <g>
          <circle cx="340" cy="75" r="36" fill={`url(#sun-water)`} />
          {softCloud(70, 60, 1)}
          {softCloud(220, 80, 0.75)}
          {/* Water */}
          <path
            d="M0 330 Q50 320 100 330 T200 330 T300 330 T400 330 L400 500 L0 500 Z"
            fill="#5BB9DF"
          />
          {/* Ripples */}
          <path
            d="M30 360 Q60 354 90 360"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M210 400 Q250 394 290 400"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M120 440 Q160 434 200 440"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Lily pads */}
          <ellipse cx="120" cy="350" rx="32" ry="8" fill="#7BC47F" />
          <ellipse cx="280" cy="380" rx="28" ry="7" fill="#7BC47F" />
        </g>
      );
    case "meadow":
      return (
        <g>
          <circle cx="330" cy="85" r="45" fill={`url(#sun-meadow)`} />
          {softCloud(90, 65, 1)}
          {softCloud(220, 50, 0.75)}
          {/* Rolling hills */}
          <path
            d="M0 360 Q80 310 160 340 Q240 360 320 320 Q370 310 400 330 L400 500 L0 500 Z"
            fill="#B8D96E"
          />
          <path
            d="M0 400 Q100 380 200 395 Q300 405 400 385 L400 500 L0 500 Z"
            fill="#9BC85A"
          />
          {/* Flowers */}
          {flowerDot(40, 430, "#FF8FAA")}
          {flowerDot(100, 450, "#FFD56B")}
          {flowerDot(170, 425, "#C29BFF")}
          {flowerDot(250, 445, "#FF9FA0")}
          {flowerDot(320, 430, "#FFB88A")}
          {flowerDot(370, 455, "#7DCCFF")}
        </g>
      );
    case "sky":
      return (
        <g>
          <circle cx="310" cy="100" r="40" fill={`url(#sun-sky)`} />
          {softCloud(60, 70, 1.2)}
          {softCloud(230, 90, 0.9)}
          {softCloud(140, 180, 0.8)}
          {softCloud(310, 220, 1.1)}
          {/* Rainbow arc */}
          <path
            d="M20 340 Q200 180 380 340"
            stroke="#FF8FAA"
            strokeWidth="10"
            fill="none"
          />
          <path
            d="M30 355 Q200 200 370 355"
            stroke="#FFC870"
            strokeWidth="10"
            fill="none"
          />
          <path
            d="M40 370 Q200 220 360 370"
            stroke="#A5D866"
            strokeWidth="10"
            fill="none"
          />
          <path
            d="M50 385 Q200 240 350 385"
            stroke="#7DCCFF"
            strokeWidth="10"
            fill="none"
          />
          <path
            d="M60 400 Q200 260 340 400"
            stroke="#C29BFF"
            strokeWidth="10"
            fill="none"
          />
        </g>
      );
    case "magic":
      return (
        <g>
          <circle cx="200" cy="170" r="80" fill="#F9DAFF" opacity="0.6" />
          <circle cx="200" cy="170" r="50" fill="#E5BBFF" opacity="0.8" />
          {/* Floating sparkles */}
          {[...Array(8)].map((_, i) => {
            const x = 40 + ((i * 53) % 340);
            const y = 60 + ((i * 37) % 280);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3" fill="#FFD6FF" />
                <path
                  d={`M${x - 8} ${y} L${x + 8} ${y} M${x} ${y - 8} L${x} ${y + 8}`}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </g>
            );
          })}
          {/* Ground glow */}
          <ellipse cx="200" cy="450" rx="200" ry="60" fill="#FFD6FF" opacity="0.4" />
        </g>
      );
    case "snow":
      return (
        <g>
          <circle cx="330" cy="90" r="32" fill="#FFF" opacity="0.8" />
          {/* Snowflakes */}
          {[...Array(14)].map((_, i) => {
            const x = 20 + ((i * 47) % 370);
            const y = 30 + ((i * 43) % 330);
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#FFFFFF" />
            );
          })}
          {/* Snow hills */}
          <path
            d="M0 380 Q100 340 200 370 Q300 390 400 355 L400 500 L0 500 Z"
            fill="#FFFFFF"
          />
        </g>
      );
    case "indoor":
      return (
        <g>
          {/* Window */}
          <rect x="60" y="80" width="280" height="200" rx="12" fill="#F3E6C8" />
          <rect x="75" y="95" width="120" height="170" rx="6" fill="#AED4F0" />
          <rect x="205" y="95" width="120" height="170" rx="6" fill="#AED4F0" />
          {/* Floor */}
          <rect y="360" width="400" height="140" fill="#E3BC82" />
          {/* Rug */}
          <ellipse cx="200" cy="440" rx="140" ry="30" fill="#F7A8A8" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="310" cy="90" r="45" fill={`url(#sun-default)`} />
          {softCloud(80, 70, 1)}
          {softCloud(230, 100, 0.8)}
        </g>
      );
  }
}

function renderGround(theme: SceneTheme) {
  if (theme === "night" || theme === "water" || theme === "indoor") return null;
  return null; // handled per-theme above
}

function softCloud(cx: number, cy: number, scale = 1) {
  const s = scale;
  return (
    <g transform={`translate(${cx - 30 * s}, ${cy - 15 * s})`}>
      <ellipse cx={15 * s} cy={20 * s} rx={22 * s} ry={14 * s} fill="#FFFFFF" opacity="0.92" />
      <ellipse cx={35 * s} cy={15 * s} rx={24 * s} ry={16 * s} fill="#FFFFFF" opacity="0.92" />
      <ellipse cx={55 * s} cy={20 * s} rx={20 * s} ry={13 * s} fill="#FFFFFF" opacity="0.92" />
    </g>
  );
}

function starField(count: number, color: string) {
  return [...Array(count)].map((_, i) => {
    const x = 20 + ((i * 67) % 360);
    const y = 30 + ((i * 43) % 220);
    const r = 1.5 + (i % 3) * 0.6;
    return (
      <circle key={i} cx={x} cy={y} r={r} fill={color}>
        <animate
          attributeName="opacity"
          values="0.4;1;0.4"
          dur={`${2 + (i % 3)}s`}
          repeatCount="indefinite"
          begin={`${(i * 0.3) % 2}s`}
        />
      </circle>
    );
  });
}

function flowerDot(cx: number, cy: number, color: string) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="5" fill={color} />
      <circle cx={cx} cy={cy} r="1.5" fill="#FFF5C2" />
    </g>
  );
}
