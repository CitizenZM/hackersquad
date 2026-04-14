"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Lock, Play, Star } from "lucide-react";

export interface JourneyNode {
  id: string;
  episodeNumber: number;
  title: string;
  state: "completed" | "current" | "future";
  thumbnailUrl: string | null;
}

interface JourneyMapProps {
  childId: string;
  storyPackId: string;
  nodes: JourneyNode[];
}

/**
 * Teach-Your-Monster style progression path.
 * Episode nodes zigzag down the screen connected by a curvy dashed path.
 */
export function JourneyMap({ childId, storyPackId, nodes }: JourneyMapProps) {
  const NODE_Y_SPACING = 160;
  const MAP_WIDTH = 320;
  const CENTER = MAP_WIDTH / 2;
  const AMPLITUDE = 90;

  function xForIndex(i: number) {
    // Sine wave position
    return CENTER + Math.sin(i * 0.9) * AMPLITUDE;
  }

  const totalHeight = nodes.length * NODE_Y_SPACING + 100;

  // Build path string
  const pathPoints = nodes.map((_, i) => ({
    x: xForIndex(i),
    y: 60 + i * NODE_Y_SPACING,
  }));

  let pathD = "";
  pathPoints.forEach((p, i) => {
    if (i === 0) {
      pathD += `M ${p.x} ${p.y}`;
    } else {
      const prev = pathPoints[i - 1];
      const cp1x = prev.x;
      const cp1y = prev.y + NODE_Y_SPACING / 2;
      const cp2x = p.x;
      const cp2y = p.y - NODE_Y_SPACING / 2;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
    }
  });

  return (
    <div className="relative mx-auto" style={{ width: MAP_WIDTH, height: totalHeight }}>
      {/* Background decorations */}
      <div className="absolute top-10 left-6 text-4xl opacity-30 animate-float">🌳</div>
      <div className="absolute top-40 right-4 text-3xl opacity-30 animate-float" style={{ animationDelay: "1s" }}>☁️</div>
      <div className="absolute top-[60%] left-2 text-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }}>🌸</div>
      <div className="absolute top-[40%] right-6 text-3xl opacity-30 animate-float" style={{ animationDelay: "0.5s" }}>🦋</div>
      <div className="absolute bottom-10 left-8 text-3xl opacity-30 animate-float" style={{ animationDelay: "1.5s" }}>🌈</div>

      {/* Path */}
      <svg
        width={MAP_WIDTH}
        height={totalHeight}
        className="absolute inset-0 pointer-events-none"
      >
        <path
          d={pathD}
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="8 10"
          strokeLinecap="round"
          fill="none"
          className="text-child-primary/30"
        />
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const { x, y } = pathPoints[i];
        const isPlayable = node.state !== "future";
        const nodeContent = (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: i * 0.08,
              type: "spring",
              stiffness: 260,
              damping: 18,
            }}
            className="flex flex-col items-center"
          >
            <motion.div
              whileTap={isPlayable ? { scale: 0.88 } : undefined}
              className={`relative flex h-[96px] w-[96px] items-center justify-center rounded-full shadow-lg ${
                node.state === "completed"
                  ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-200"
                  : node.state === "current"
                  ? "bg-gradient-to-br from-amber-300 to-orange-400 shadow-orange-200 animate-pulse-glow ring-4 ring-white"
                  : "bg-gradient-to-br from-gray-300 to-gray-400 opacity-60"
              }`}
            >
              {node.thumbnailUrl && node.state !== "future" ? (
                <div className="h-[80px] w-[80px] overflow-hidden rounded-full border-4 border-white">
                  <img
                    src={node.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : node.state === "completed" ? (
                <Check className="h-12 w-12 text-white" strokeWidth={3.5} />
              ) : node.state === "current" ? (
                <Play className="h-10 w-10 text-white ml-1" fill="white" />
              ) : (
                <Lock className="h-9 w-9 text-white/80" />
              )}

              {/* Episode number badge */}
              <div className="absolute -top-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
                <span className="text-sm font-bold text-child-primary">
                  {node.episodeNumber}
                </span>
              </div>

              {/* Star for completed */}
              {node.state === "completed" && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
                  className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 shadow-md"
                >
                  <Star className="h-5 w-5 text-white" fill="white" strokeWidth={2} />
                </motion.div>
              )}
            </motion.div>

            <p
              className={`mt-2 max-w-[120px] text-center text-xs font-semibold leading-tight line-clamp-2 ${
                node.state === "future" ? "text-foreground/40" : "text-foreground/80"
              }`}
            >
              {node.title}
            </p>
          </motion.div>
        );

        return (
          <div
            key={node.id}
            className="absolute"
            style={{ left: x - 48, top: y - 48 }}
          >
            {isPlayable ? (
              <Link href={`/play/${childId}/${storyPackId}/${node.id}`}>
                {nodeContent}
              </Link>
            ) : (
              nodeContent
            )}
          </div>
        );
      })}
    </div>
  );
}
