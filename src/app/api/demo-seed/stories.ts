import type { SceneMetadata, SceneTheme } from "@/lib/scene-themes";

export interface SeedScene {
  text: string;
  duration: number;
  theme: SceneTheme;
  character: { emoji: string; position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" };
  hotspots: Array<{
    emoji: string;
    sound: "tap" | "pop" | "sparkle" | "whoosh";
    reaction: string;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  }>;
}

export interface SeedEpisode {
  title: string;
  scenes: SeedScene[];
  vocab: { word: string; definition: string; example: string }[];
}

export interface SeedStory {
  title: string;
  storyGoal: "ENTERTAIN" | "EDUCATE" | "MORAL_LESSON" | "VOCABULARY" | "BEDTIME";
  visualStyle: "CARTOON" | "WATERCOLOR" | "STORYBOOK" | "PIXEL_ART";
  episodes: SeedEpisode[];
}

export function toMetadata(scene: SeedScene): SceneMetadata {
  return {
    theme: scene.theme,
    character: scene.character,
    hotspots: scene.hotspots,
  };
}
