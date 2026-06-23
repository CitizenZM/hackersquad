// Single source of truth mapping the campaign "Platform & Duration" selection
// to: the video-search strategy, the VideoResult platforms to keep, and the
// ContentType enum values to display on the Content page. This keeps search and
// filtering consistent with what the user picked (e.g. choose TikTok → only
// TikTok/Reels videos are searched and shown).

export type VideoPlatform = "youtube" | "youtube_short" | "tiktok" | "vimeo";
export type SearchStrategy = "short_social" | "tvc" | "mixed";

export interface CampaignPlatform {
  id: string;
  label: string;
  defaultDurationSec: number;
  searchStrategy: SearchStrategy;
  /** VideoResult.platform values to keep when searching. */
  videoPlatforms: VideoPlatform[];
  /** ContentType enum values to show on the Content page. */
  contentTypes: string[];
}

export const CAMPAIGN_PLATFORMS: Record<string, CampaignPlatform> = {
  tiktok: {
    id: "tiktok",
    label: "TikTok / Reels",
    defaultDurationSec: 30,
    searchStrategy: "short_social",
    videoPlatforms: ["tiktok"],
    contentTypes: ["TIKTOK_VIDEO", "SOCIAL_POST"],
  },
  instagram: {
    id: "instagram",
    label: "Instagram Feed",
    defaultDurationSec: 15,
    searchStrategy: "short_social",
    // Instagram reels are stored under the "tiktok" social platform / SOCIAL_POST.
    videoPlatforms: ["tiktok"],
    contentTypes: ["SOCIAL_POST", "TIKTOK_VIDEO"],
  },
  youtube: {
    id: "youtube",
    label: "YouTube Pre-roll",
    defaultDurationSec: 30,
    searchStrategy: "mixed",
    videoPlatforms: ["youtube", "youtube_short"],
    contentTypes: ["YOUTUBE_VIDEO", "YOUTUBE_SHORT"],
  },
  tvc: {
    id: "tvc",
    label: "TVC (Television)",
    defaultDurationSec: 60,
    searchStrategy: "tvc",
    videoPlatforms: ["youtube", "vimeo"],
    contentTypes: ["YOUTUBE_VIDEO", "VIMEO_VIDEO"],
  },
  amazon: {
    id: "amazon",
    label: "Amazon PDP Video",
    defaultDurationSec: 30,
    searchStrategy: "mixed",
    videoPlatforms: ["youtube", "tiktok"],
    contentTypes: ["YOUTUBE_VIDEO", "TIKTOK_VIDEO"],
  },
};

/** Resolve a saved platform id (case-insensitive) to its config, or null. */
export function getCampaignPlatform(
  platform: string | null | undefined
): CampaignPlatform | null {
  if (!platform) return null;
  return CAMPAIGN_PLATFORMS[platform.toLowerCase()] ?? null;
}
