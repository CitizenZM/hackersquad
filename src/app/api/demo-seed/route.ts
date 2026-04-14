import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import type { SceneMetadata, SceneTheme } from "@/lib/scene-themes";

interface SeedScene {
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

interface SeedEpisode {
  title: string;
  scriptText: string; // full 1000-word text that counts towards word budget
  scenes: SeedScene[];
  vocab: { word: string; definition: string; example: string }[];
}

const DEMO_CHILD = {
  name: "Mia",
  age: 6,
  ageGroup: "AGE_5_6" as const,
  language: "en",
  interests: ["animals", "adventure", "magic"],
};

const DEMO_STORY_TITLE = "Milo's Starlight Adventure";

// ─────────────────────────────────────────────────────────────
// Episode 1 — ~1000 words of adapted narration, split across
// 8 flashcard scenes. Each scene's `text` is what is narrated
// while that flashcard is on screen. Character quotes use
// double-quotes so the storytelling voice shifts into the
// higher-pitched "character" tone on those words.
// ─────────────────────────────────────────────────────────────
const EPISODE_1: SeedEpisode = {
  title: "A Star Falls From the Sky",
  scriptText: "", // filled below from scenes
  scenes: [
    {
      text:
        "In a cozy little den at the edge of the deep forest lived a young bear cub named Milo. Milo had soft brown fur, round cheeks, and the biggest, curious eyes you ever saw. Every night, Mama Bear tucked him in under a warm patchwork blanket. She kissed his nose, whispered \"Sweet dreams, my little star,\" and turned out the lamp. But tonight, Milo was not sleepy at all. His paws wiggled. His tail twitched. His tummy felt like it had a hundred butterflies dancing inside.",
      duration: 18,
      theme: "indoor",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "🕯️", sound: "sparkle", reaction: "A candle!", position: "top-left" },
        { emoji: "💤", sound: "pop", reaction: "Shhh, sleepy time!", position: "top-right" },
      ],
    },
    {
      text:
        "Very quietly, Milo tiptoed to the round window of his den. Outside, the night sky was dark and velvety, sprinkled with a thousand silver stars. The moon was as round as a pancake. A soft breeze made the leaves whisper. Milo pressed his wet little nose against the glass and sighed a happy sigh. \"Hello, moon,\" he whispered. \"Hello, stars.\" And just as he spoke, something magical happened.",
      duration: 16,
      theme: "night",
      character: { emoji: "🐻", position: "bottom-left" },
      hotspots: [
        { emoji: "🌙", sound: "sparkle", reaction: "Goodnight, moon!", position: "top-right" },
        { emoji: "⭐", sound: "pop", reaction: "Twinkle!", position: "top-left" },
      ],
    },
    {
      text:
        "Whoosh! A tiny shooting star zipped across the sky. It sparkled gold and pink and blue. It swooped down, down, down, and landed somewhere deep in the forest with a soft, glittery thump. Milo's eyes went as wide as saucers. A real falling star, right here in his forest! He just had to find it. He put on his favorite red scarf and very, very quietly slipped out the door.",
      duration: 15,
      theme: "sky",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "💫", sound: "whoosh", reaction: "Whoosh!", position: "top-left" },
        { emoji: "✨", sound: "sparkle", reaction: "Sparkles!", position: "top-right" },
      ],
    },
    {
      text:
        "The meadow was bathed in silver moonlight. Tall grass tickled Milo's belly. Sleepy flowers nodded their heads. A family of fireflies blinked hello, floating like tiny yellow lanterns. Milo walked softly so he wouldn't wake anybody. Every few steps he looked up to follow the trail of sparkles the star had left behind. The sparkles led him to the edge of the willow woods.",
      duration: 15,
      theme: "meadow",
      character: { emoji: "🐻", position: "bottom-left" },
      hotspots: [
        { emoji: "🌼", sound: "sparkle", reaction: "A flower!", position: "top-right" },
        { emoji: "🦗", sound: "pop", reaction: "Chirp chirp!", position: "top-left" },
      ],
    },
    {
      text:
        "Under the tallest willow tree sat Old Hootie the owl, smoothing her feathers with her beak. \"Hoo goes there?\" she called softly. \"It is only me, Milo,\" said Milo. \"Did you see the shooting star?\" Old Hootie nodded her wise round head. \"Follow the shimmer,\" she hooted. \"It fell by the singing stream.\" She pointed a feathery wing, and Milo said thank you and hurried along.",
      duration: 16,
      theme: "forest",
      character: { emoji: "🦉", position: "top-right" },
      hotspots: [
        { emoji: "🪶", sound: "whoosh", reaction: "A feather!", position: "top-left" },
        { emoji: "🌳", sound: "pop", reaction: "A tall tree!", position: "bottom-left" },
      ],
    },
    {
      text:
        "The singing stream giggled and bubbled over smooth round stones. On a shiny lily pad sat a little green frog named Pip. \"Ribbit ribbit,\" said Pip. \"Are you looking for the falling star?\" \"Yes!\" said Milo. Pip hopped twice and splashed. \"The shimmer went that way, to the old stone well.\" Pip showed Milo the way, hopping from stone to stone across the water.",
      duration: 15,
      theme: "water",
      character: { emoji: "🐸", position: "bottom-left" },
      hotspots: [
        { emoji: "🫧", sound: "pop", reaction: "A bubble!", position: "top-right" },
        { emoji: "🐟", sound: "whoosh", reaction: "A little fish!", position: "bottom-right" },
      ],
    },
    {
      text:
        "Deep in the woods stood an old, old well, covered in soft green moss. A warm golden glow spilled up from inside. Milo peeked over the edge. Way down at the bottom, curled up in a tiny ball, was the little lost star. Her light was soft and trembly, like a flickering candle. She looked very small and very scared. \"Don't be afraid,\" Milo whispered. \"I'm here to help.\"",
      duration: 17,
      theme: "magic",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "🌟", sound: "sparkle", reaction: "A tiny star!", position: "top-right" },
        { emoji: "💖", sound: "pop", reaction: "Don't be scared!", position: "top-left" },
      ],
    },
    {
      text:
        "The little star peeked up with shiny, tear-drop eyes. \"I flew too low,\" she said in a voice like a tinkle of bells. \"And now I can't get back home.\" Milo's heart felt warm. He thought and he thought and he thought. Then his whiskers twitched. \"I have a brave idea,\" said Milo. \"Wait right here, little star. I'll be back with friends, and together we'll get you home.\"",
      duration: 16,
      theme: "magic",
      character: { emoji: "🐻", position: "bottom-left" },
      hotspots: [
        { emoji: "💡", sound: "sparkle", reaction: "An idea!", position: "top-right" },
        { emoji: "🌟", sound: "pop", reaction: "Stay here, star!", position: "top-left" },
      ],
    },
  ],
  vocab: [
    {
      word: "meadow",
      definition: "A field full of grass and pretty flowers.",
      example: "Butterflies danced in the sunny meadow.",
    },
    {
      word: "shimmer",
      definition: "A soft, shiny light that glows and dances.",
      example: "The star left a shimmer of sparkles in the sky.",
    },
    {
      word: "whisper",
      definition: "To speak in a very quiet, soft voice.",
      example: "Milo whispered goodnight to the moon.",
    },
    {
      word: "brave",
      definition: "Feeling strong in your heart, even when you're a little scared.",
      example: "Milo was brave when he went into the dark forest.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Episode 2 — ~1000 words, 8 scenes
// ─────────────────────────────────────────────────────────────
const EPISODE_2: SeedEpisode = {
  title: "Flying Home Together",
  scriptText: "",
  scenes: [
    {
      text:
        "Milo hurried back through the moonlit meadow. \"Friends! Friends!\" he called softly. \"I need your help!\" First he found Pip the frog by the stream, polishing a shiny pebble. Pip listened, eyes wide. \"A real falling star?\" he gasped. \"I'll help! Ribbit!\" Pip hopped high into the air and splashed back down, ready for adventure.",
      duration: 14,
      theme: "water",
      character: { emoji: "🐸", position: "bottom-right" },
      hotspots: [
        { emoji: "🫧", sound: "pop", reaction: "A bubble!", position: "top-right" },
        { emoji: "💧", sound: "whoosh", reaction: "Splash!", position: "top-left" },
      ],
    },
    {
      text:
        "Next, Milo went back to Old Hootie's willow tree. The wise owl fluffed her feathers. \"A little star trapped in the old stone well?\" she said. \"Oh my. Oh my indeed.\" She spread her big soft wings. \"I know exactly what we need. Pinecones! Big strong pinecones. We can stack them up so the star can climb out.\" Milo clapped his paws. \"Pinecones! What a wonderful idea!\"",
      duration: 16,
      theme: "forest",
      character: { emoji: "🦉", position: "top-right" },
      hotspots: [
        { emoji: "🌲", sound: "pop", reaction: "A pine tree!", position: "bottom-left" },
        { emoji: "🪶", sound: "sparkle", reaction: "Hootie's feather!", position: "top-left" },
      ],
    },
    {
      text:
        "Along the path they met Rosie the rabbit, with her twitchy pink nose, and Nutty the squirrel, who had three acorns tucked in his cheeks. \"A tower of pinecones?\" said Rosie. \"I am very good at finding things.\" \"I am very good at climbing,\" said Nutty, spitting out the acorns. \"We will help!\" cheered the friends. Together they scampered off to the tall pine trees.",
      duration: 16,
      theme: "forest",
      character: { emoji: "🐰", position: "bottom-left" },
      hotspots: [
        { emoji: "🥜", sound: "pop", reaction: "An acorn!", position: "top-right" },
        { emoji: "🐿️", sound: "whoosh", reaction: "Hello, squirrel!", position: "top-left" },
      ],
    },
    {
      text:
        "The pine trees were tall and smelled like fresh breeze. Pinecones lay everywhere on the soft brown ground. \"One, two, three!\" counted Rosie, hopping from one to the next. Nutty scampered up a trunk and tossed pinecones down. Pip caught them in a big lily pad like a basket. Old Hootie carried the biggest ones in her claws. Milo rolled two pinecones at a time with his nose. It was very, very funny.",
      duration: 16,
      theme: "forest",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "🌰", sound: "pop", reaction: "A chestnut!", position: "top-left" },
        { emoji: "🍂", sound: "whoosh", reaction: "Leaves!", position: "top-right" },
      ],
    },
    {
      text:
        "At the old stone well, the little star was still waiting, glowing softly. \"We're back!\" called Milo. \"And we brought friends!\" The little star's light grew a little brighter. One by one, the friends dropped pinecones down into the well. Plop. Plop. Plop. The pile grew taller and taller. The star climbed on top, holding on with her tiny twinkly arms. \"Higher! Higher!\" the friends cheered together.",
      duration: 16,
      theme: "magic",
      character: { emoji: "🌟", position: "top-left" },
      hotspots: [
        { emoji: "🌰", sound: "pop", reaction: "Plop!", position: "top-right" },
        { emoji: "✨", sound: "sparkle", reaction: "Higher!", position: "bottom-left" },
      ],
    },
    {
      text:
        "When the tower was tall enough, the little star peeked over the top of the well. She blinked up at the night sky. She was shining so brightly now. Milo reached out his soft paw. \"Ready to fly?\" he asked gently. The little star smiled. \"Thank you, my friends,\" she said. \"You are the kindest animals in all the forest.\" She hugged each one with a little golden sparkle.",
      duration: 16,
      theme: "magic",
      character: { emoji: "🌟", position: "top-right" },
      hotspots: [
        { emoji: "💖", sound: "sparkle", reaction: "A hug!", position: "bottom-left" },
        { emoji: "🤝", sound: "pop", reaction: "Kind friends!", position: "bottom-right" },
      ],
    },
    {
      text:
        "Then, with one, two, three — whoosh! — the little star shot up, up, up into the velvet sky. She left a long trail of shimmering sparkles behind. Milo and his friends stood very still. They tipped their heads all the way back and watched until the little star joined the other stars and twinkled brightly, happy and home at last. The whole sky seemed to smile.",
      duration: 15,
      theme: "sky",
      character: { emoji: "🌠", position: "top-right" },
      hotspots: [
        { emoji: "☁️", sound: "whoosh", reaction: "A fluffy cloud!", position: "top-left" },
        { emoji: "🌈", sound: "sparkle", reaction: "A rainbow!", position: "bottom-left" },
      ],
    },
    {
      text:
        "Milo said goodbye to his friends with warm, cozy hugs. He padded home through the meadow. His paws were tired, but his heart was full. Mama Bear was waiting at the door with her warmest smile. Milo snuggled under his patchwork blanket. \"Goodnight, stars,\" he whispered. \"Goodnight, friends.\" And somewhere up above, a little star twinkled brighter than all the others, just for Milo.",
      duration: 16,
      theme: "night",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "🌙", sound: "sparkle", reaction: "Goodnight, moon!", position: "top-left" },
        { emoji: "💤", sound: "pop", reaction: "Sleep tight!", position: "top-right" },
      ],
    },
  ],
  vocab: [
    {
      word: "pinecone",
      definition: "A little bumpy seed-house that grows on pine trees.",
      example: "A pinecone fell from the tree.",
    },
    {
      word: "tower",
      definition: "Something very tall and strong, stacked high up.",
      example: "They built a tower of pinecones.",
    },
    {
      word: "friend",
      definition: "Someone who helps you and makes your heart happy.",
      example: "Milo had the kindest friends.",
    },
    {
      word: "twinkle",
      definition: "A little sparkle of light that flashes on and off.",
      example: "The stars twinkle high up in the sky.",
    },
  ],
};

// Fill scriptText from scenes
for (const ep of [EPISODE_1, EPISODE_2]) {
  ep.scriptText = ep.scenes.map((s) => s.text).join("\n\n");
}

export async function POST() {
  try {
    const { parentId } = await getDefaultParent();

    // Check if demo already exists
    const existingChild = await prisma.childProfile.findFirst({
      where: { parentId, name: DEMO_CHILD.name },
      include: { storyPacks: { select: { id: true, title: true } } },
    });

    // If a previous demo (old Luna story) exists, wipe its story pack so
    // this new Milo demo can be seeded clean.
    if (existingChild) {
      await prisma.storyPack.deleteMany({
        where: {
          parentId,
          childProfileId: existingChild.id,
          title: { in: [DEMO_STORY_TITLE, "Luna the Little Fox"] },
        },
      });
    }

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

    // Create demo source using concatenated episode text as the "source"
    const fullText = [EPISODE_1, EPISODE_2].map((e) => e.scriptText).join("\n\n");
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    const source = await prisma.storySource.create({
      data: {
        parentId,
        sourceType: "TEXT_PASTE",
        title: DEMO_STORY_TITLE,
        rawText: fullText,
        wordCount,
        language: "en",
      },
    });

    const episodes = [EPISODE_1, EPISODE_2];

    const storyPack = await prisma.storyPack.create({
      data: {
        sourceId: source.id,
        childProfileId: child.id,
        parentId,
        title: DEMO_STORY_TITLE,
        storyGoal: "BEDTIME",
        narrationMode: "DEFAULT_TTS",
        visualStyle: "WATERCOLOR",
        status: "PUBLISHED",
        episodeCount: episodes.length,
        coverImageUrl: null, // CartoonScene renders the cover-equivalent
      },
    });

    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];
      const totalDuration = ep.scenes.reduce((a, s) => a + s.duration, 0);

      const episode = await prisma.episode.create({
        data: {
          storyPackId: storyPack.id,
          episodeNumber: i + 1,
          title: ep.title,
          scriptText: ep.scriptText,
          wordBudget: ep.scriptText.split(/\s+/).filter(Boolean).length,
          durationTarget: totalDuration,
        },
      });

      for (let j = 0; j < ep.scenes.length; j++) {
        const scene = ep.scenes[j];
        const metadata: SceneMetadata = {
          theme: scene.theme,
          character: scene.character,
          hotspots: scene.hotspots,
        };
        await prisma.flashcardScene.create({
          data: {
            episodeId: episode.id,
            sceneOrder: j + 1,
            // Store scene metadata (JSON) in the prompt column
            prompt: JSON.stringify(metadata),
            imageUrl: null, // CartoonScene renders the backdrop
            textSnippet: scene.text,
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
      message: `Demo loaded: ${DEMO_STORY_TITLE} (${episodes.length} episodes, ${wordCount} words)`,
      childId: child.id,
      storyPackId: storyPack.id,
      wordCount,
      episodeCount: episodes.length,
    });
  } catch (error) {
    console.error("Demo seed error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
