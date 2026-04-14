import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

interface SeedEpisodeScene {
  textSnippet: string;
  imageSeed: string;
  duration: number;
}

interface SeedEpisode {
  title: string;
  scriptText: string;
  scenes: SeedEpisodeScene[];
  vocab: { word: string; definition: string; example: string }[];
}

const DEMO_CHILD = {
  name: "Mia",
  age: 6,
  ageGroup: "AGE_5_6" as const,
  language: "en",
  interests: ["animals", "adventure", "magic"],
};

const DEMO_STORY_TITLE = "Luna the Little Fox";
const DEMO_STORY_COVER_SEED = "luna-fox-cover";

const DEMO_EPISODES: SeedEpisode[] = [
  {
    title: "Meet Luna",
    scriptText:
      "In the misty meadow lived a little fox named Luna. Her fur was the color of autumn leaves. Every morning she danced through the tall grass, chasing butterflies and sunbeams. Today would be an extra special day — she was going to make her very first friend.",
    scenes: [
      {
        textSnippet: "In the misty meadow lived a little fox named Luna.",
        imageSeed: "luna-1a",
        duration: 6,
      },
      {
        textSnippet: "Her fur was the color of autumn leaves.",
        imageSeed: "luna-1b",
        duration: 5,
      },
      {
        textSnippet: "She danced through tall grass, chasing butterflies.",
        imageSeed: "luna-1c",
        duration: 6,
      },
      {
        textSnippet: "Today, she was going to make her very first friend!",
        imageSeed: "luna-1d",
        duration: 6,
      },
    ],
    vocab: [
      {
        word: "meadow",
        definition: "A field with lots of grass and flowers.",
        example: "The meadow was full of yellow daisies.",
      },
      {
        word: "autumn",
        definition: "The season when leaves turn orange and fall down.",
        example: "I love jumping in autumn leaves!",
      },
      {
        word: "butterfly",
        definition: "A pretty bug with colorful wings that flies gently.",
        example: "A blue butterfly landed on my nose.",
      },
    ],
  },
  {
    title: "The Secret River",
    scriptText:
      "Luna followed the sound of splashing water to a sparkling river hidden behind the willow trees. On a lily pad sat a tiny green frog named Pip. 'Hello!' croaked Pip. 'Would you like to hop with me?' Luna giggled and they spent the whole afternoon playing by the water.",
    scenes: [
      {
        textSnippet: "Luna heard splashing behind the willow trees.",
        imageSeed: "luna-2a",
        duration: 6,
      },
      {
        textSnippet: "She found a sparkling secret river.",
        imageSeed: "luna-2b",
        duration: 5,
      },
      {
        textSnippet: "On a lily pad sat a tiny green frog named Pip.",
        imageSeed: "luna-2c",
        duration: 6,
      },
      {
        textSnippet: "They played by the water all afternoon long!",
        imageSeed: "luna-2d",
        duration: 6,
      },
    ],
    vocab: [
      {
        word: "sparkling",
        definition: "Shining with lots of tiny lights.",
        example: "The stars are sparkling tonight.",
      },
      {
        word: "willow",
        definition: "A tree with long, bendy branches that droop down.",
        example: "The willow leaves swayed in the wind.",
      },
      {
        word: "lily pad",
        definition: "A flat leaf that floats on top of water.",
        example: "The frog hopped onto a big lily pad.",
      },
    ],
  },
  {
    title: "Home Under the Stars",
    scriptText:
      "As the sun went down, Luna and Pip counted fireflies that flickered like tiny stars. Luna hugged her new friend goodnight and curled up in her cozy den. She closed her eyes with a happy smile, already dreaming about tomorrow's adventure.",
    scenes: [
      {
        textSnippet: "The sun went down with pink and orange colors.",
        imageSeed: "luna-3a",
        duration: 6,
      },
      {
        textSnippet: "Fireflies flickered like tiny stars.",
        imageSeed: "luna-3b",
        duration: 5,
      },
      {
        textSnippet: "Luna hugged Pip goodnight.",
        imageSeed: "luna-3c",
        duration: 5,
      },
      {
        textSnippet: "She curled up dreaming of tomorrow's adventure.",
        imageSeed: "luna-3d",
        duration: 6,
      },
    ],
    vocab: [
      {
        word: "firefly",
        definition: "A little bug that glows in the dark.",
        example: "We caught fireflies in a jar.",
      },
      {
        word: "cozy",
        definition: "Warm and comfy.",
        example: "I love my cozy blanket.",
      },
      {
        word: "adventure",
        definition: "An exciting thing you do or explore.",
        example: "Going to the zoo was an adventure!",
      },
    ],
  },
];

function img(seed: string, size = 800): string {
  return `https://picsum.photos/seed/${seed}/${size}/${size}`;
}

export async function POST() {
  try {
    const { parentId } = await getDefaultParent();

    // Check if demo already exists
    const existingChild = await prisma.childProfile.findFirst({
      where: { parentId, name: DEMO_CHILD.name },
      include: { storyPacks: { select: { id: true, title: true } } },
    });

    if (existingChild && existingChild.storyPacks.some((s) => s.title === DEMO_STORY_TITLE)) {
      return Response.json({
        success: true,
        message: "Demo already loaded!",
        childId: existingChild.id,
      });
    }

    // Create or reuse child
    const child =
      existingChild ||
      (await prisma.childProfile.create({
        data: {
          parentId,
          name: DEMO_CHILD.name,
          age: DEMO_CHILD.age,
          ageGroup: DEMO_CHILD.ageGroup,
          language: DEMO_CHILD.language,
          interests: DEMO_CHILD.interests,
          learningMode: "LISTEN",
        },
      }));

    // Create demo source
    const fullText = DEMO_EPISODES.map((e) => e.scriptText).join("\n\n");
    const source = await prisma.storySource.create({
      data: {
        parentId,
        sourceType: "TEXT_PASTE",
        title: DEMO_STORY_TITLE,
        rawText: fullText,
        wordCount: fullText.split(/\s+/).length,
        language: "en",
      },
    });

    // Create story pack
    const storyPack = await prisma.storyPack.create({
      data: {
        sourceId: source.id,
        childProfileId: child.id,
        parentId,
        title: DEMO_STORY_TITLE,
        storyGoal: "ENTERTAIN",
        narrationMode: "DEFAULT_TTS",
        visualStyle: "WATERCOLOR",
        status: "PUBLISHED",
        episodeCount: DEMO_EPISODES.length,
        coverImageUrl: img(DEMO_STORY_COVER_SEED, 1024),
      },
    });

    // Create episodes + scenes + vocab
    for (let i = 0; i < DEMO_EPISODES.length; i++) {
      const ep = DEMO_EPISODES[i];
      const totalDuration = ep.scenes.reduce((a, s) => a + s.duration, 0);

      const episode = await prisma.episode.create({
        data: {
          storyPackId: storyPack.id,
          episodeNumber: i + 1,
          title: ep.title,
          scriptText: ep.scriptText,
          wordBudget: ep.scriptText.split(/\s+/).length,
          durationTarget: totalDuration,
        },
      });

      for (let j = 0; j < ep.scenes.length; j++) {
        const scene = ep.scenes[j];
        await prisma.flashcardScene.create({
          data: {
            episodeId: episode.id,
            sceneOrder: j + 1,
            prompt: scene.textSnippet,
            imageUrl: img(scene.imageSeed, 800),
            textSnippet: scene.textSnippet,
            duration: scene.duration,
          },
        });
      }

      for (const v of ep.vocab) {
        await prisma.vocabularyCard.create({
          data: {
            episodeId: episode.id,
            word: v.word,
            definition: v.definition,
            example: v.example,
          },
        });
      }
    }

    return Response.json({
      success: true,
      message: "Demo content loaded!",
      childId: child.id,
      storyPackId: storyPack.id,
    });
  } catch (error) {
    console.error("Demo seed error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Seed failed",
      },
      { status: 500 }
    );
  }
}
