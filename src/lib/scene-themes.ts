/**
 * Scene themes — ambient visual + audio backdrop per scene.
 * Detected from scene text snippet keywords.
 */

export type SceneTheme =
  | "night"
  | "forest"
  | "water"
  | "meadow"
  | "sky"
  | "magic"
  | "indoor"
  | "snow"
  | "default";

export interface ThemeConfig {
  particles: string[]; // emojis that drift across the scene
  gradient: string; // tailwind classes for the fallback gradient
  keywords: string[];
}

export const SCENE_THEMES: Record<SceneTheme, ThemeConfig> = {
  night: {
    particles: ["⭐", "🌌", "🌙", "💫"],
    gradient: "from-indigo-900 via-purple-800 to-slate-900",
    keywords: [
      "night",
      "stars",
      "moon",
      "dark",
      "sleep",
      "bed",
      "midnight",
      "twinkle",
      "starlight",
      "asleep",
      "starry",
    ],
  },
  forest: {
    particles: ["🍃", "🌿", "🦋", "🌸"],
    gradient: "from-emerald-200 via-green-100 to-lime-50",
    keywords: [
      "forest",
      "tree",
      "trees",
      "branch",
      "leaf",
      "leaves",
      "woods",
      "willow",
      "oak",
      "acorn",
      "pinecone",
      "owl",
      "bear",
      "rabbit",
      "squirrel",
    ],
  },
  water: {
    particles: ["💧", "🫧", "🐟", "🌊"],
    gradient: "from-sky-200 via-cyan-100 to-blue-100",
    keywords: [
      "stream",
      "river",
      "water",
      "pond",
      "lake",
      "splash",
      "frog",
      "fish",
      "bubble",
      "ripple",
      "well",
    ],
  },
  meadow: {
    particles: ["🌼", "🐝", "🦋", "🌻"],
    gradient: "from-amber-100 via-yellow-50 to-lime-50",
    keywords: [
      "meadow",
      "grass",
      "field",
      "flower",
      "flowers",
      "bloom",
      "petal",
      "hill",
    ],
  },
  sky: {
    particles: ["☁️", "🕊️", "🎈", "🌈"],
    gradient: "from-sky-200 via-blue-100 to-violet-100",
    keywords: [
      "sky",
      "cloud",
      "clouds",
      "fly",
      "fell",
      "falling",
      "shooting",
      "soar",
      "up",
    ],
  },
  magic: {
    particles: ["✨", "💫", "🌟", "🔮"],
    gradient: "from-fuchsia-200 via-violet-100 to-pink-100",
    keywords: [
      "wish",
      "magic",
      "glow",
      "shimmer",
      "sparkle",
      "enchant",
      "whisper",
    ],
  },
  snow: {
    particles: ["❄️", "🌨️", "⛄", "💨"],
    gradient: "from-slate-100 via-blue-50 to-white",
    keywords: ["snow", "ice", "cold", "frost", "winter", "flake"],
  },
  indoor: {
    particles: ["🕯️", "🧸", "💛", "🏠"],
    gradient: "from-amber-100 via-orange-50 to-yellow-50",
    keywords: [
      "home",
      "house",
      "bed",
      "pillow",
      "blanket",
      "den",
      "cozy",
      "warm",
      "lamp",
    ],
  },
  default: {
    particles: ["⭐", "✨", "💫"],
    gradient: "from-sky-100 via-violet-50 to-rose-100",
    keywords: [],
  },
};

export function detectTheme(text: string): SceneTheme {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let bestTheme: SceneTheme = "default";
  let bestScore = 0;

  for (const [name, config] of Object.entries(SCENE_THEMES)) {
    if (name === "default") continue;
    let score = 0;
    for (const kw of config.keywords) {
      // Count occurrences for stronger signal
      const count = words.filter((w) => w.includes(kw)).length;
      if (count > 0) {
        score += Math.min(count, 3); // cap per keyword to avoid single-word dominance
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTheme = name as SceneTheme;
    }
  }

  return bestTheme;
}

// Shape of JSON stored in FlashcardScene.prompt for enhanced scenes
export interface SceneMetadata {
  theme?: SceneTheme;
  character?: {
    emoji: string;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  };
  hotspots?: Array<{
    emoji: string;
    sound?: "tap" | "pop" | "sparkle" | "whoosh" | "success" | "unlock";
    reaction?: string;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  }>;
}

export function parseSceneMetadata(
  prompt: string | null | undefined
): SceneMetadata | null {
  if (!prompt) return null;
  try {
    const parsed = JSON.parse(prompt);
    if (parsed && typeof parsed === "object") {
      return parsed as SceneMetadata;
    }
  } catch {
    // not JSON, just the old DALL-E prompt string
  }
  return null;
}
