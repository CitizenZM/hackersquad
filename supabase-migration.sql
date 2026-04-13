-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('AGE_3_4', 'AGE_5_6', 'AGE_7_9');

-- CreateEnum
CREATE TYPE "LearningMode" AS ENUM ('LISTEN', 'READ_ALONG', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('TEXT_PASTE', 'PDF_UPLOAD', 'DOC_UPLOAD', 'TXT_UPLOAD');

-- CreateEnum
CREATE TYPE "StoryGoal" AS ENUM ('ENTERTAIN', 'EDUCATE', 'MORAL_LESSON', 'VOCABULARY', 'BEDTIME');

-- CreateEnum
CREATE TYPE "NarrationMode" AS ENUM ('DEFAULT_TTS', 'PARENT_VOICE');

-- CreateEnum
CREATE TYPE "VisualStyle" AS ENUM ('CARTOON', 'WATERCOLOR', 'STORYBOOK', 'PIXEL_ART');

-- CreateEnum
CREATE TYPE "StoryPackStatus" AS ENUM ('DRAFT', 'PROCESSING', 'REVIEW_READY', 'APPROVED', 'PUBLISHED', 'ERROR');

-- CreateEnum
CREATE TYPE "VoiceProfileStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PipelineJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'ERROR');

-- CreateEnum
CREATE TYPE "SessionEventType" AS ENUM ('PLAY_START', 'PLAY_PAUSE', 'PLAY_RESUME', 'PLAY_COMPLETE', 'EPISODE_START', 'EPISODE_COMPLETE', 'FLASHCARD_VIEW', 'VOCABULARY_TAP');

-- CreateTable
CREATE TABLE "ParentAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "interests" JSONB NOT NULL DEFAULT '[]',
    "learningMode" "LearningMode" NOT NULL DEFAULT 'LISTEN',
    "avatarUrl" TEXT,
    "pin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorySource" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "fileUrl" TEXT,
    "wordCount" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPack" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "storyGoal" "StoryGoal" NOT NULL DEFAULT 'ENTERTAIN',
    "narrationMode" "NarrationMode" NOT NULL DEFAULT 'DEFAULT_TTS',
    "visualStyle" "VisualStyle" NOT NULL DEFAULT 'CARTOON',
    "status" "StoryPackStatus" NOT NULL DEFAULT 'DRAFT',
    "episodeCount" INTEGER NOT NULL DEFAULT 0,
    "coverImageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "storyPackId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "scriptText" TEXT NOT NULL,
    "sourceExcerpt" TEXT,
    "wordBudget" INTEGER NOT NULL,
    "durationTarget" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardScene" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "sceneOrder" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "textSnippet" TEXT NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashcardScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyCard" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "example" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "voiceType" TEXT NOT NULL DEFAULT 'default',
    "sampleAudioUrl" TEXT,
    "status" "VoiceProfileStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "cartoonStyle" TEXT NOT NULL DEFAULT 'friendly',
    "assignedName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvatarProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineJob" (
    "id" TEXT NOT NULL,
    "storyPackId" TEXT NOT NULL,
    "status" "PipelineJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "steps" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEvent" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "storyPackId" TEXT NOT NULL,
    "episodeId" TEXT,
    "eventType" "SessionEventType" NOT NULL,
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_email_key" ON "ParentAccount"("email");

-- CreateIndex
CREATE INDEX "ChildProfile_parentId_idx" ON "ChildProfile"("parentId");

-- CreateIndex
CREATE INDEX "StorySource_parentId_idx" ON "StorySource"("parentId");

-- CreateIndex
CREATE INDEX "StoryPack_parentId_idx" ON "StoryPack"("parentId");

-- CreateIndex
CREATE INDEX "StoryPack_childProfileId_idx" ON "StoryPack"("childProfileId");

-- CreateIndex
CREATE INDEX "StoryPack_sourceId_idx" ON "StoryPack"("sourceId");

-- CreateIndex
CREATE INDEX "Episode_storyPackId_idx" ON "Episode"("storyPackId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_storyPackId_episodeNumber_key" ON "Episode"("storyPackId", "episodeNumber");

-- CreateIndex
CREATE INDEX "FlashcardScene_episodeId_idx" ON "FlashcardScene"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardScene_episodeId_sceneOrder_key" ON "FlashcardScene"("episodeId", "sceneOrder");

-- CreateIndex
CREATE INDEX "VocabularyCard_episodeId_idx" ON "VocabularyCard"("episodeId");

-- CreateIndex
CREATE INDEX "VoiceProfile_parentId_idx" ON "VoiceProfile"("parentId");

-- CreateIndex
CREATE INDEX "AvatarProfile_parentId_idx" ON "AvatarProfile"("parentId");

-- CreateIndex
CREATE INDEX "PipelineJob_storyPackId_status_idx" ON "PipelineJob"("storyPackId", "status");

-- CreateIndex
CREATE INDEX "SessionEvent_childProfileId_idx" ON "SessionEvent"("childProfileId");

-- CreateIndex
CREATE INDEX "SessionEvent_storyPackId_idx" ON "SessionEvent"("storyPackId");

-- CreateIndex
CREATE INDEX "SessionEvent_createdAt_idx" ON "SessionEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorySource" ADD CONSTRAINT "StorySource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPack" ADD CONSTRAINT "StoryPack_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "StorySource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPack" ADD CONSTRAINT "StoryPack_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPack" ADD CONSTRAINT "StoryPack_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_storyPackId_fkey" FOREIGN KEY ("storyPackId") REFERENCES "StoryPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardScene" ADD CONSTRAINT "FlashcardScene_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyCard" ADD CONSTRAINT "VocabularyCard_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceProfile" ADD CONSTRAINT "VoiceProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarProfile" ADD CONSTRAINT "AvatarProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_storyPackId_fkey" FOREIGN KEY ("storyPackId") REFERENCES "StoryPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEvent" ADD CONSTRAINT "SessionEvent_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEvent" ADD CONSTRAINT "SessionEvent_storyPackId_fkey" FOREIGN KEY ("storyPackId") REFERENCES "StoryPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEvent" ADD CONSTRAINT "SessionEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

