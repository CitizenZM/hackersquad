import { z } from "zod";

export const signupSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createChildSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(3).max(9),
  language: z.string().default("en"),
  interests: z.array(z.string()).default([]),
  learningMode: z.enum(["LISTEN", "READ_ALONG", "INTERACTIVE"]).default("LISTEN"),
  pin: z.string().length(4).regex(/^\d{4}$/).optional(),
});

export const updateChildSchema = createChildSchema.partial();

export const createSourceSchema = z.object({
  sourceType: z.enum(["TEXT_PASTE", "PDF_UPLOAD", "DOC_UPLOAD", "TXT_UPLOAD"]),
  title: z.string().min(1, "Title is required"),
  rawText: z.string().min(1, "Content is required"),
  fileUrl: z.string().optional(),
  wordCount: z.number().int().min(1),
  language: z.string().default("en"),
});

export const createStoryPackSchema = z.object({
  sourceId: z.string().min(1),
  childProfileId: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  description: z.string().max(200).default(""),
  storyGoal: z.enum(["ENTERTAIN", "EDUCATE", "MORAL_LESSON", "VOCABULARY", "BEDTIME"]).default("ENTERTAIN"),
  narrationMode: z.enum(["DEFAULT_TTS", "PARENT_VOICE"]).default("DEFAULT_TTS"),
  visualStyle: z.enum(["CARTOON", "WATERCOLOR", "STORYBOOK", "PIXEL_ART"]).default("CARTOON"),
});

export const updateStoryPackSchema = createStoryPackSchema.partial();

export const createSessionEventSchema = z.object({
  childProfileId: z.string().min(1),
  storyPackId: z.string().min(1),
  episodeId: z.string().optional(),
  eventType: z.enum([
    "PLAY_START",
    "PLAY_PAUSE",
    "PLAY_RESUME",
    "PLAY_COMPLETE",
    "EPISODE_START",
    "EPISODE_COMPLETE",
    "FLASHCARD_VIEW",
    "VOCABULARY_TAP",
  ]),
  duration: z.number().int().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createVoiceProfileSchema = z.object({
  voiceType: z.string().default("default"),
  sampleAudioUrl: z.string().optional(),
});

export const createAvatarSchema = z.object({
  imageUrl: z.string().optional(),
  cartoonStyle: z.string().default("friendly"),
  assignedName: z.string().optional(),
});
