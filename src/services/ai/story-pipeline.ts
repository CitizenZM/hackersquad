import { prisma } from "@/lib/db";
import { jobManager } from "@/services/job-manager";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { estimateEpisodeCount } from "@/lib/constants";
import {
  getTextUnderstandingPrompts,
  textUnderstandingSchema,
} from "./prompts/text-understanding";
import {
  getChildAdaptationPrompts,
  childAdaptationSchema,
} from "./prompts/child-adaptation";
import {
  getEpisodeSplittingPrompts,
  episodeSplitSchema,
} from "./prompts/episode-splitting";
import {
  getSceneBreakdownPrompts,
  sceneBreakdownSchema,
} from "./prompts/scene-breakdown";
import {
  getImagePromptsForScenes,
  imagePromptsSchema,
} from "./prompts/image-prompts";
import {
  getVocabularyExtractionPrompts,
  vocabularyExtractionSchema,
} from "./prompts/vocabulary-extraction";
import { generateNarration } from "./services/tts-service";
import { generateImage, generateCoverImage } from "./services/image-generation";
import { moderateContent } from "./services/moderation-service";

const PIPELINE_STEPS = [
  "Parse & Ingest",
  "Understand Text",
  "Adapt for Child",
  "Build Episodes",
  "Generate Narration",
  "Create Flashcards",
  "Safety Check",
  "Package & Finalize",
];

export async function runStoryPipeline(
  storyPackId: string,
  jobId: string
) {
  const job = jobManager.createJob(jobId, storyPackId, PIPELINE_STEPS);
  jobManager.startJob(job.id);

  try {
    const storyPack = await prisma.storyPack.findUniqueOrThrow({
      where: { id: storyPackId },
      include: {
        source: true,
        childProfile: true,
      },
    });

    await prisma.storyPack.update({
      where: { id: storyPackId },
      data: { status: "PROCESSING" },
    });

    const { source, childProfile } = storyPack;

    // ── Layer 1: Parse & Ingest ──
    jobManager.startStep(jobId, "Parse & Ingest");
    const wordCount = source.wordCount;
    const episodeCount = estimateEpisodeCount(wordCount);
    await prisma.storyPack.update({
      where: { id: storyPackId },
      data: { episodeCount },
    });
    jobManager.updateStepProgress(jobId, "Parse & Ingest", 100, `${wordCount} words → ${episodeCount} episodes`);
    jobManager.completeStep(jobId, "Parse & Ingest");

    // ── Layer 2: Understand Text ──
    jobManager.startStep(jobId, "Understand Text");
    const { systemPrompt: uSys, userPrompt: uUser } = getTextUnderstandingPrompts(source.rawText);
    const understanding = await analyzeWithClaude({
      systemPrompt: uSys,
      userPrompt: uUser,
      responseSchema: textUnderstandingSchema,
      maxTokens: 4096,
    });
    await prisma.storyPack.update({
      where: { id: storyPackId },
      data: { metadata: JSON.parse(JSON.stringify(understanding)) },
    });
    jobManager.updateStepProgress(jobId, "Understand Text", 100, "Text analyzed");
    jobManager.completeStep(jobId, "Understand Text");

    // ── Layer 3: Adapt for Child ──
    jobManager.startStep(jobId, "Adapt for Child");
    const { systemPrompt: aSys, userPrompt: aUser } = getChildAdaptationPrompts(
      source.rawText,
      childProfile.ageGroup,
      storyPack.storyGoal,
      understanding
    );
    const adaptation = await analyzeWithClaude({
      systemPrompt: aSys,
      userPrompt: aUser,
      responseSchema: childAdaptationSchema,
      maxTokens: 16384,
    });
    jobManager.updateStepProgress(jobId, "Adapt for Child", 100, `Adapted: ${adaptation.adaptedWordCount} words`);
    jobManager.completeStep(jobId, "Adapt for Child");

    // ── Layer 4: Build Episodes ──
    jobManager.startStep(jobId, "Build Episodes");
    const { systemPrompt: eSys, userPrompt: eUser } = getEpisodeSplittingPrompts(
      adaptation.adaptedText,
      episodeCount,
      storyPack.storyGoal
    );
    const split = await analyzeWithClaude({
      systemPrompt: eSys,
      userPrompt: eUser,
      responseSchema: episodeSplitSchema,
      maxTokens: 16384,
    });

    for (const ep of split.episodes) {
      await prisma.episode.create({
        data: {
          storyPackId,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          scriptText: ep.scriptText,
          wordBudget: ep.wordBudget,
          durationTarget: Math.min(300, Math.ceil((ep.wordBudget / 150) * 60)),
        },
      });
    }
    jobManager.updateStepProgress(jobId, "Build Episodes", 100, `${split.episodes.length} episodes created`);
    jobManager.completeStep(jobId, "Build Episodes");

    // ── Layer 5: Generate Narration ──
    jobManager.startStep(jobId, "Generate Narration");
    const episodes = await prisma.episode.findMany({
      where: { storyPackId },
      orderBy: { episodeNumber: "asc" },
    });

    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];
      const audioUrl = await generateNarration(ep.scriptText, "nova", ep.id);
      await prisma.episode.update({
        where: { id: ep.id },
        data: { audioUrl },
      });
      jobManager.updateStepProgress(
        jobId,
        "Generate Narration",
        Math.round(((i + 1) / episodes.length) * 100),
        `Episode ${i + 1} narrated`
      );
    }
    jobManager.completeStep(jobId, "Generate Narration");

    // ── Layer 6: Create Flashcards ──
    jobManager.startStep(jobId, "Create Flashcards");
    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];

      // Break into scenes
      const { systemPrompt: sSys, userPrompt: sUser } = getSceneBreakdownPrompts(
        ep.title,
        ep.scriptText,
        storyPack.visualStyle
      );
      const breakdown = await analyzeWithClaude({
        systemPrompt: sSys,
        userPrompt: sUser,
        responseSchema: sceneBreakdownSchema,
      });

      // Generate image prompts
      const { systemPrompt: iSys, userPrompt: iUser } = getImagePromptsForScenes(
        breakdown.scenes,
        storyPack.visualStyle,
        storyPack.title
      );
      const imgPrompts = await analyzeWithClaude({
        systemPrompt: iSys,
        userPrompt: iUser,
        responseSchema: imagePromptsSchema,
      });

      // Generate images and create scenes
      for (const scene of breakdown.scenes) {
        const imgPrompt = imgPrompts.prompts.find(
          (p) => p.sceneOrder === scene.sceneOrder
        );
        let imageUrl: string | undefined;

        try {
          imageUrl = await generateImage(
            imgPrompt?.imagePrompt || scene.sceneDescription,
            `${ep.id}-scene-${scene.sceneOrder}`
          );
        } catch (err) {
          console.error(`Image gen failed for scene ${scene.sceneOrder}:`, err);
        }

        // Calculate scene duration proportionally
        const totalTextLength = breakdown.scenes.reduce(
          (sum, s) => sum + s.textSnippet.length,
          0
        );
        const sceneDuration = Math.round(
          (scene.textSnippet.length / totalTextLength) * ep.durationTarget
        );

        await prisma.flashcardScene.create({
          data: {
            episodeId: ep.id,
            sceneOrder: scene.sceneOrder,
            prompt: imgPrompt?.imagePrompt || scene.sceneDescription,
            imageUrl,
            textSnippet: scene.textSnippet,
            duration: sceneDuration,
          },
        });
      }

      jobManager.updateStepProgress(
        jobId,
        "Create Flashcards",
        Math.round(((i + 1) / episodes.length) * 100),
        `Episode ${i + 1} scenes created`
      );
    }
    jobManager.completeStep(jobId, "Create Flashcards");

    // ── Layer 7: Safety Check ──
    jobManager.startStep(jobId, "Safety Check");
    let allSafe = true;
    for (const ep of episodes) {
      const result = await moderateContent(ep.scriptText, childProfile.ageGroup);
      if (!result.safe) {
        allSafe = false;
        jobManager.updateStepProgress(
          jobId,
          "Safety Check",
          50,
          `Warning: Episode ${ep.episodeNumber} flagged - ${result.issues.map((i) => i.description).join(", ")}`
        );
      }
    }

    if (!allSafe) {
      jobManager.updateStepProgress(jobId, "Safety Check", 100, "Content flagged - review required");
    } else {
      jobManager.updateStepProgress(jobId, "Safety Check", 100, "All content safe");
    }
    jobManager.completeStep(jobId, "Safety Check");

    // ── Layer 8: Package & Finalize ──
    jobManager.startStep(jobId, "Package & Finalize");

    // Generate cover image
    let coverImageUrl: string | undefined;
    try {
      coverImageUrl = await generateCoverImage(storyPack.title, storyPack.visualStyle);
    } catch (err) {
      console.error("Cover image generation failed:", err);
    }

    // Extract vocabulary for each episode
    for (const ep of episodes) {
      try {
        const { systemPrompt: vSys, userPrompt: vUser } = getVocabularyExtractionPrompts(
          ep.scriptText,
          childProfile.ageGroup
        );
        const vocab = await analyzeWithClaude({
          systemPrompt: vSys,
          userPrompt: vUser,
          responseSchema: vocabularyExtractionSchema,
        });
        for (const word of vocab.words) {
          await prisma.vocabularyCard.create({
            data: {
              episodeId: ep.id,
              word: word.word,
              definition: word.definition,
              example: word.example,
            },
          });
        }
      } catch (err) {
        console.error(`Vocab extraction failed for episode ${ep.episodeNumber}:`, err);
      }
    }

    await prisma.storyPack.update({
      where: { id: storyPackId },
      data: {
        status: "REVIEW_READY",
        coverImageUrl,
      },
    });

    jobManager.updateStepProgress(jobId, "Package & Finalize", 100, "Story pack ready for review");
    jobManager.completeStep(jobId, "Package & Finalize");
    jobManager.completeJob(jobId);

    // Update pipeline job in DB
    await prisma.pipelineJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETE",
        progress: 100,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Pipeline error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    jobManager.failJob(jobId, errorMessage);

    await prisma.storyPack.update({
      where: { id: storyPackId },
      data: { status: "ERROR" },
    });

    await prisma.pipelineJob.update({
      where: { id: jobId },
      data: {
        status: "ERROR",
        error: errorMessage,
        completedAt: new Date(),
      },
    });
  }
}
