export const AGE_GROUP_LABELS: Record<string, string> = {
  AGE_3_4: "Ages 3-4",
  AGE_5_6: "Ages 5-6",
  AGE_7_9: "Ages 7-9",
};

export const STORY_GOAL_LABELS: Record<string, string> = {
  ENTERTAIN: "Entertain",
  EDUCATE: "Educate",
  MORAL_LESSON: "Moral Lesson",
  VOCABULARY: "Vocabulary",
  BEDTIME: "Bedtime",
};

export const STORY_GOAL_DESCRIPTIONS: Record<string, string> = {
  ENTERTAIN: "Fun and engaging stories for pure enjoyment",
  EDUCATE: "Educational content that teaches new concepts",
  MORAL_LESSON: "Stories with valuable life lessons",
  VOCABULARY: "Focus on building word knowledge",
  BEDTIME: "Calm, soothing stories for winding down",
};

export const VISUAL_STYLE_LABELS: Record<string, string> = {
  CARTOON: "Cartoon",
  WATERCOLOR: "Watercolor",
  STORYBOOK: "Storybook",
  PIXEL_ART: "Pixel Art",
};

export const NARRATION_MODE_LABELS: Record<string, string> = {
  DEFAULT_TTS: "Default Narrator",
  PARENT_VOICE: "Parent Voice",
};

export const STORY_PACK_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PROCESSING: "Processing",
  REVIEW_READY: "Ready for Review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ERROR: "Error",
};

export const LEARNING_MODE_LABELS: Record<string, string> = {
  LISTEN: "Listen",
  READ_ALONG: "Read Along",
  INTERACTIVE: "Interactive",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  TEXT_PASTE: "Pasted Text",
  PDF_UPLOAD: "PDF Upload",
  DOC_UPLOAD: "Document Upload",
  TXT_UPLOAD: "Text File Upload",
};

export const WORDS_PER_EPISODE = 1000;
export const MAX_EPISODE_DURATION_SECONDS = 300;
export const FLASHCARDS_PER_EPISODE_MIN = 6;
export const FLASHCARDS_PER_EPISODE_MAX = 10;
export const VOCAB_WORDS_PER_EPISODE_MIN = 3;
export const VOCAB_WORDS_PER_EPISODE_MAX = 8;

export function ageToAgeGroup(age: number): "AGE_3_4" | "AGE_5_6" | "AGE_7_9" {
  if (age <= 4) return "AGE_3_4";
  if (age <= 6) return "AGE_5_6";
  return "AGE_7_9";
}

export function estimateEpisodeCount(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_EPISODE));
}
