-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'RESEARCHING', 'ANALYZED', 'GENERATING', 'COMPLETE', 'ERROR');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('OFFICIAL_API', 'PUBLIC_WEB', 'USER_INPUT', 'AI_INFERRED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('YOUTUBE_VIDEO', 'WEBSITE_PAGE', 'SOCIAL_POST', 'WEB_MENTION', 'REVIEW');

-- CreateEnum
CREATE TYPE "NarrativeType" AS ENUM ('PROBLEM_SOLUTION', 'TESTIMONIAL', 'DEMONSTRATION', 'LIFESTYLE', 'EDUCATIONAL', 'COMPARISON', 'STORY_ARC', 'UGC_STYLE', 'TREND_RIDING', 'BEFORE_AFTER');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandUrl" TEXT,
    "category" TEXT,
    "campaignGoal" TEXT,
    "brandHealthScore" DOUBLE PRECISION,
    "opportunityScore" DOUBLE PRECISION,
    "topSignals" JSONB,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "brandPromise" TEXT,
    "valueProposition" TEXT,
    "toneOfVoice" TEXT,
    "targetAudience" TEXT,
    "pricingTheme" TEXT,
    "socialProof" JSONB,
    "ctaLanguage" JSONB,
    "productFeatures" JSONB,
    "dataSource" "DataSource" NOT NULL DEFAULT 'AI_INFERRED',
    "rawCrawlData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "brandPromise" TEXT,
    "valueProposition" TEXT,
    "toneOfVoice" TEXT,
    "pricingTheme" TEXT,
    "productFeatures" JSONB,
    "ctaLanguage" JSONB,
    "socialProof" JSONB,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "dataSource" "DataSource" NOT NULL DEFAULT 'AI_INFERRED',
    "rawCrawlData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "competitorId" TEXT,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "description" TEXT,
    "publishedAt" TIMESTAMP(3),
    "platform" TEXT,
    "viewCount" INTEGER,
    "likeCount" INTEGER,
    "commentCount" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "metricsSource" "DataSource" NOT NULL DEFAULT 'AI_INFERRED',
    "overallScore" DOUBLE PRECISION,
    "hookStrength" DOUBLE PRECISION,
    "productVisibility" DOUBLE PRECISION,
    "storytellingArc" DOUBLE PRECISION,
    "ctaQuality" DOUBLE PRECISION,
    "emotionalAppeal" DOUBLE PRECISION,
    "pacing" DOUBLE PRECISION,
    "hookText" TEXT,
    "narrativeType" "NarrativeType",
    "keyMessages" JSONB,
    "transcript" TEXT,
    "isBrandOwned" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" "DataSource" NOT NULL DEFAULT 'OFFICIAL_API',
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contentAssetId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" DOUBLE PRECISION,
    "evidence" JSONB,
    "recommendation" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'AI_INFERRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativePattern" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "NarrativeType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "avgPerformance" DOUBLE PRECISION,
    "examples" JSONB,
    "bestPractices" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarrativePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellingPoint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "point" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "strength" DOUBLE PRECISION,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "competitorUsage" BOOLEAN NOT NULL DEFAULT false,
    "uniqueness" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellingPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "hookVariants" JSONB NOT NULL,
    "body" TEXT NOT NULL,
    "ctaVariants" JSONB NOT NULL,
    "narrativeType" "NarrativeType",
    "targetEmotion" TEXT,
    "predictedScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storyboard" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scriptId" TEXT,
    "title" TEXT NOT NULL,
    "frames" JSONB NOT NULL,
    "totalDuration" TEXT,
    "style" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Storyboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeVariant" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "hookVariant" TEXT NOT NULL,
    "narrativeType" "NarrativeType" NOT NULL,
    "ctaVariant" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "predictedScore" DOUBLE PRECISION,
    "rationale" TEXT,
    "scriptOutline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreviewAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "style" TEXT,
    "dimensions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "steps" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_projectId_key" ON "Brand"("projectId");

-- CreateIndex
CREATE INDEX "ContentAsset_projectId_type_idx" ON "ContentAsset"("projectId", "type");

-- CreateIndex
CREATE INDEX "ContentAsset_projectId_overallScore_idx" ON "ContentAsset"("projectId", "overallScore");

-- CreateIndex
CREATE INDEX "Insight_projectId_category_idx" ON "Insight"("projectId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "NarrativePattern_projectId_type_key" ON "NarrativePattern"("projectId", "type");

-- CreateIndex
CREATE INDEX "SellingPoint_projectId_category_idx" ON "SellingPoint"("projectId", "category");

-- CreateIndex
CREATE INDEX "CreativeVariant_projectId_predictedScore_idx" ON "CreativeVariant"("projectId", "predictedScore");

-- CreateIndex
CREATE INDEX "ResearchJob_projectId_status_idx" ON "ResearchJob"("projectId", "status");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativePattern" ADD CONSTRAINT "NarrativePattern_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellingPoint" ADD CONSTRAINT "SellingPoint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storyboard" ADD CONSTRAINT "Storyboard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeVariant" ADD CONSTRAINT "CreativeVariant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreviewAsset" ADD CONSTRAINT "PreviewAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchJob" ADD CONSTRAINT "ResearchJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
