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
        "In a cozy little den at the edge of the deep, deep forest, there lived a young bear cub named Milo. Milo had soft, shaggy brown fur, round pink cheeks, and the biggest, most curious eyes you ever saw. Every single night, Mama Bear tucked him in under a warm patchwork blanket that smelled like pine trees and honey. She kissed his black button nose and whispered, \"Sweet dreams, my little star.\" Then she turned the lamp down low, until the room was filled with a soft golden glow. But tonight, Milo was not sleepy at all, not even one little bit. His paws wiggled under the covers. His tail twitched this way and that. His tummy felt like it had a hundred tiny butterflies dancing all at once. Something exciting was going to happen tonight. He just knew it in his bones.",
      duration: 22,
      theme: "indoor",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "🕯️", sound: "sparkle", reaction: "A candle!", position: "top-left" },
        { emoji: "💤", sound: "pop", reaction: "Shhh, sleepy time!", position: "top-right" },
      ],
    },
    {
      text:
        "Very quietly, oh so quietly, Milo tiptoed out of bed and across the wooden floor. He stopped at the round window of his den and peeked outside. The night sky was dark and velvety, sprinkled with a thousand shimmering silver stars. The moon was as round and bright as a big pancake made of light. A soft breeze made all the leaves whisper little secrets. Milo pressed his wet little nose against the cool glass and sighed a long, happy sigh. \"Hello, moon,\" he whispered. \"Hello, stars. Hello, sleepy whole wide world.\" And just as he spoke those last words, something truly magical happened up in the sky.",
      duration: 20,
      theme: "night",
      character: { emoji: "🐻", position: "bottom-left" },
      hotspots: [
        { emoji: "🌙", sound: "sparkle", reaction: "Goodnight, moon!", position: "top-right" },
        { emoji: "⭐", sound: "pop", reaction: "Twinkle!", position: "top-left" },
      ],
    },
    {
      text:
        "Whoosh! A tiny shooting star zipped across the whole sky. It sparkled gold and pink and bright blue, leaving a trail of shimmering dust behind it. It swooped down, down, down, faster and faster, and landed somewhere deep in the forest with a soft, glittery thump. Milo's round eyes went as wide as two shiny saucers. A real falling star, right here in his very own forest! He just had to find it, he simply had to. He pulled on his favorite red scarf, the one Grandma Bear had knitted for him, and very, very, very quietly slipped out the little round door.",
      duration: 19,
      theme: "sky",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "💫", sound: "whoosh", reaction: "Whoosh!", position: "top-left" },
        { emoji: "✨", sound: "sparkle", reaction: "Sparkles!", position: "top-right" },
      ],
    },
    {
      text:
        "The meadow was bathed in cool silver moonlight, soft and calm. Tall grass tickled Milo's round belly as he waded through. Sleepy flowers nodded their colorful heads and puffed out little yawns. A whole family of twinkling fireflies blinked a friendly hello, floating here and there like tiny yellow lanterns. Milo walked softly, softly on his padded paws, so he wouldn't wake up anybody. Every few steps he tipped his head back and looked up, following the long glittery trail of sparkles the shooting star had left behind. The shimmer led him on, right to the edge of the tall, whispering willow woods.",
      duration: 19,
      theme: "meadow",
      character: { emoji: "🐻", position: "bottom-left" },
      hotspots: [
        { emoji: "🌼", sound: "sparkle", reaction: "A flower!", position: "top-right" },
        { emoji: "🦗", sound: "pop", reaction: "Chirp chirp!", position: "top-left" },
      ],
    },
    {
      text:
        "Under the very tallest willow tree, with its long sweeping branches, sat Old Hootie the wise owl, carefully smoothing her soft grey feathers with her curved beak. \"Hoo goes there in the middle of the night?\" she called softly into the dark. \"It is only me, Hootie. It's Milo the bear cub,\" said Milo in his politest voice. \"Please, did you see the shooting star come down?\" Old Hootie blinked her big amber eyes and nodded her wise round head up and down. \"Follow the shimmer, little one,\" she hooted. \"The star fell by the singing stream, just past the mossy rocks.\" She pointed the way with one soft feathery wing. Milo said a big thank you, bowed his head, and hurried off along the moonlit path.",
      duration: 22,
      theme: "forest",
      character: { emoji: "🦉", position: "top-right" },
      hotspots: [
        { emoji: "🪶", sound: "whoosh", reaction: "A feather!", position: "top-left" },
        { emoji: "🌳", sound: "pop", reaction: "A tall tree!", position: "bottom-left" },
      ],
    },
    {
      text:
        "The singing stream giggled and bubbled happily over smooth, round, speckled stones. Silver fish darted under the water, and tiny bubbles floated up to the surface and popped with a pretty sound. On a shiny green lily pad sat a little round frog named Pip. He had bright yellow eyes and a friendly smile. \"Ribbit, ribbit,\" said Pip, puffing out his bumpy throat. \"Are you looking for the falling star, Mister Bear?\" \"Yes!\" said Milo, nodding so hard his ears wobbled. Pip hopped twice on his lily pad and made a silly splash that got Milo's paws wet. \"The shimmer went that way, past the mossy rocks, all the way to the old stone well.\" And Pip showed Milo the way, hopping brightly from stone to stone across the stream.",
      duration: 22,
      theme: "water",
      character: { emoji: "🐸", position: "bottom-left" },
      hotspots: [
        { emoji: "🫧", sound: "pop", reaction: "A bubble!", position: "top-right" },
        { emoji: "🐟", sound: "whoosh", reaction: "A little fish!", position: "bottom-right" },
      ],
    },
    {
      text:
        "Deep, deep in the quiet woods stood an old, old stone well, all covered in soft green moss and twisty little vines. A warm golden glow, like sunshine caught in a jar, spilled up from somewhere inside. Milo held his breath and stood on his tippy-toes to peek right over the edge of the well. Way, way down at the bottom, curled up in a tiny glowing ball, was the little lost star. Her light was soft and trembly, like a flickering candle in the breeze. She looked so very small, and so very scared, and so very far from home. \"Don't be afraid, little star,\" Milo whispered gently. \"I'm right here. I came to help you get back home.\"",
      duration: 22,
      theme: "magic",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "🌟", sound: "sparkle", reaction: "A tiny star!", position: "top-right" },
        { emoji: "💖", sound: "pop", reaction: "Don't be scared!", position: "top-left" },
      ],
    },
    {
      text:
        "The little star slowly peeked up with shiny, tear-drop eyes. \"I was flying through the sky, playing catch with the clouds, and I flew too low,\" she said in a small voice like a tinkle of tiny bells. \"And now I can't get back up. The well is too deep and my light is too small.\" Milo's warm bear heart felt full of kindness. He sat down by the edge of the well and he thought and he thought and he thought some more. Then his whiskers twitched and his eyes lit up. \"I have a brave idea!\" said Milo with a smile. \"Wait right here, little star. Don't be scared. I'll be back soon with my forest friends, and together, all of us, we will find a way to get you home.\"",
      duration: 22,
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
        "Milo hurried back through the silver, moonlit meadow, his red scarf bouncing. \"Friends! Friends!\" he called in an excited whisper. \"I need your help! Please come quickly!\" First he found Pip the frog by the stream, happily polishing a shiny round pebble with a leaf. Pip stopped polishing. His big yellow eyes went wide, and his throat puffed out. \"A real, real, real falling star? A true one?\" he gasped. \"Of course I'll help! Ribbit!\" Pip hopped high, high up into the air and splashed right back down with the biggest splash you ever saw, ready for a grand adventure.",
      duration: 19,
      theme: "water",
      character: { emoji: "🐸", position: "bottom-right" },
      hotspots: [
        { emoji: "🫧", sound: "pop", reaction: "A bubble!", position: "top-right" },
        { emoji: "💧", sound: "whoosh", reaction: "Splash!", position: "top-left" },
      ],
    },
    {
      text:
        "Next, Milo and Pip went back to Old Hootie's willow tree. The wise owl fluffed her big grey feathers and listened very carefully, head tilted to one side. \"A little lost star, trapped at the bottom of the old stone well?\" she said slowly. \"Oh my. Oh my goodness, indeed.\" She spread out her big soft wings wide. \"I know exactly what we need to do. Pinecones! Big, strong, round pinecones! If we all gather a lot of them, we can stack them up, one on top of another, so the little star can climb right out.\" Milo clapped his paws together with joy. \"Pinecones! Oh, what a wonderful, wonderful idea, Hootie!\"",
      duration: 22,
      theme: "forest",
      character: { emoji: "🦉", position: "top-right" },
      hotspots: [
        { emoji: "🌲", sound: "pop", reaction: "A pine tree!", position: "bottom-left" },
        { emoji: "🪶", sound: "sparkle", reaction: "Hootie's feather!", position: "top-left" },
      ],
    },
    {
      text:
        "Along the winding path they met Rosie the rabbit, with her long floppy ears and her twitchy pink nose, and Nutty the squirrel, who had three fat acorns tucked inside his chubby cheeks. Milo explained everything in a hurry. \"A tower of pinecones, you say?\" said Rosie, giving a big hop of excitement. \"I am very, very good at finding things in the forest.\" \"And I am very, very good at climbing and tossing,\" said Nutty, spitting out all three of his acorns at once. \"We will help! We will help!\" cheered the friends all together. And with that, the whole merry group scampered off to the tall, fragrant pine trees on the hill.",
      duration: 22,
      theme: "forest",
      character: { emoji: "🐰", position: "bottom-left" },
      hotspots: [
        { emoji: "🥜", sound: "pop", reaction: "An acorn!", position: "top-right" },
        { emoji: "🐿️", sound: "whoosh", reaction: "Hello, squirrel!", position: "top-left" },
      ],
    },
    {
      text:
        "The pine trees were very tall and smelled wonderfully like a fresh, piney breeze. Brown pinecones lay scattered everywhere on the soft, needle-covered ground. \"One, two, three!\" counted Rosie, hopping cheerfully from one pinecone to the next, gathering them into a neat pile. Nutty the squirrel scampered right up a tall tree trunk and began tossing pinecones down from the branches. Pip the frog caught them all in a great big lily pad that he used just like a basket. Old Hootie the owl carried the biggest, heaviest pinecones safely in her strong claws. And Milo rolled two round pinecones at a time with his wet black nose. It was all very, very silly and very, very funny, and everybody laughed together.",
      duration: 22,
      theme: "forest",
      character: { emoji: "🐻", position: "bottom-right" },
      hotspots: [
        { emoji: "🌰", sound: "pop", reaction: "A chestnut!", position: "top-left" },
        { emoji: "🍂", sound: "whoosh", reaction: "Leaves!", position: "top-right" },
      ],
    },
    {
      text:
        "At the old stone well, the little star was still waiting patiently, glowing softly in the dark. \"We're back, little star! We're back!\" called Milo happily. \"And we brought all our wonderful friends!\" The little star's light grew just a tiny bit brighter, and she smiled. One by one, very carefully, the friends dropped the pinecones down, down, down into the deep well. Plop. Plop. Plop. Plop. The pile at the bottom grew taller and taller and taller still. The little star climbed right up on top of the pile, holding on with her tiny twinkly arms. \"Higher! Higher! Almost there!\" the friends cheered together, clapping their paws and wings.",
      duration: 22,
      theme: "magic",
      character: { emoji: "🌟", position: "top-left" },
      hotspots: [
        { emoji: "🌰", sound: "pop", reaction: "Plop!", position: "top-right" },
        { emoji: "✨", sound: "sparkle", reaction: "Higher!", position: "bottom-left" },
      ],
    },
    {
      text:
        "When the pinecone tower was tall enough, the little star peeked right over the top of the well, and smiled. She blinked her shiny eyes up at the whole big beautiful night sky. She was shining so brightly now, like a little golden lantern. Milo reached out his soft, furry paw. \"Are you ready to fly home, little one?\" he asked very gently. The little star smiled the brightest smile of all. \"Thank you, thank you, my new friends,\" she said. \"You are the kindest, bravest animals in the whole entire forest, and I will never, ever forget you.\" Then she hugged each one with a warm little golden sparkle that tickled.",
      duration: 22,
      theme: "magic",
      character: { emoji: "🌟", position: "top-right" },
      hotspots: [
        { emoji: "💖", sound: "sparkle", reaction: "A hug!", position: "bottom-left" },
        { emoji: "🤝", sound: "pop", reaction: "Kind friends!", position: "bottom-right" },
      ],
    },
    {
      text:
        "Then, with one big, two big, three big — whoosh! — the little star shot up, up, up, way up into the soft velvet sky. She left a long, bright trail of shimmering sparkles behind her as she went. Milo and all his forest friends stood very, very still on the soft mossy ground. They tipped their heads all the way back and watched in wonder. They watched and watched until the little star soared back up among all the other twinkly stars, and she twinkled brightly there, happy and safe and home at last. The whole big sky seemed to smile down on them.",
      duration: 22,
      theme: "sky",
      character: { emoji: "🌠", position: "top-right" },
      hotspots: [
        { emoji: "☁️", sound: "whoosh", reaction: "A fluffy cloud!", position: "top-left" },
        { emoji: "🌈", sound: "sparkle", reaction: "A rainbow!", position: "bottom-left" },
      ],
    },
    {
      text:
        "Milo said goodbye to his wonderful friends with big, warm, cozy bear hugs for each one. Then he padded slowly back home through the silver meadow, with his red scarf trailing behind him. His paws were tired from the long night's adventure, but oh, his little heart was so, so full of happiness. Mama Bear was waiting at the door of the den with her very warmest smile and open arms. Milo gave her a great big hug, then snuggled right back under his soft patchwork blanket. \"Goodnight, stars. Goodnight, moon. Goodnight, dear friends,\" he whispered softly. And somewhere high above, a little star twinkled brighter than all the other stars in the whole sky, twinkling down just for Milo.",
      duration: 24,
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
// ─────────────────────────────────────────────────────────────
// Story 2: "Pip's Puddle Parade" — 1 episode, ~800 words
// A cheerful daytime story for younger kids (AGE_3_4)
// ─────────────────────────────────────────────────────────────
const PIP_EPISODE: SeedEpisode = {
  title: "Splish, Splash, Hooray!",
  scriptText: "",
  scenes: [
    {
      text: "It rained and rained all morning long. Big fat raindrops went pitter-patter, pitter-patter on the leaves. Little Pip the frog sat under a big red mushroom, watching the rain come down. He wiggled his green toes and smiled his wide frog smile. Pip loved the rain because he knew what came after the rain. Puddles! Big, shiny, wonderful puddles, everywhere you looked!",
      duration: 16,
      theme: "water",
      character: { emoji: "🐸", position: "bottom-right" },
      hotspots: [
        { emoji: "🍄", sound: "pop", reaction: "A mushroom!", position: "top-left" },
        { emoji: "💧", sound: "tap", reaction: "Drip drop!", position: "top-right" },
      ],
    },
    {
      text: "When the rain stopped, the sun peeked out from behind a fluffy cloud. \"Hello, sun!\" said Pip. He hopped out from under his mushroom and looked all around. The whole meadow was full of puddles. Some were tiny and round like coins. Some were big and long like little rivers. Every single puddle sparkled in the sunshine like a little mirror. \"Time for a puddle parade!\" Pip cheered, and he hopped to the very first puddle.",
      duration: 18,
      theme: "meadow",
      character: { emoji: "🐸", position: "bottom-left" },
      hotspots: [
        { emoji: "☀️", sound: "sparkle", reaction: "Hello, sun!", position: "top-right" },
        { emoji: "🌈", sound: "whoosh", reaction: "A rainbow!", position: "top-left" },
      ],
    },
    {
      text: "At the first puddle, Pip found Duckling. Duckling was splashing with her little yellow feet, going splash, splash, splash! Water flew everywhere! \"Come splash with me, Pip!\" said Duckling. So Pip jumped right in. Splash! The water went up, up, up and came back down like rain all over again. \"Wheee!\" laughed Pip. \"Wheee!\" laughed Duckling. They splashed and splashed until their tummies hurt from laughing.",
      duration: 18,
      theme: "water",
      character: { emoji: "🐥", position: "bottom-right" },
      hotspots: [
        { emoji: "🐥", sound: "pop", reaction: "Quack quack!", position: "top-left" },
        { emoji: "🫧", sound: "tap", reaction: "Splash!", position: "top-right" },
      ],
    },
    {
      text: "At the next puddle, Pip found Snail. Snail was looking at her own face in the still, calm water. \"Look, Pip! I can see myself!\" said Snail. \"And I can see the sky in the puddle too!\" Pip leaned over and looked. He could see his own big yellow eyes looking back at him, and behind his face, the bright blue sky with white fluffy clouds. \"The puddle has a sky inside it!\" said Pip, and his eyes went wide with wonder.",
      duration: 18,
      theme: "meadow",
      character: { emoji: "🐌", position: "bottom-left" },
      hotspots: [
        { emoji: "🐌", sound: "sparkle", reaction: "Hello, Snail!", position: "top-right" },
        { emoji: "☁️", sound: "whoosh", reaction: "A cloud!", position: "top-left" },
      ],
    },
    {
      text: "The third puddle was the biggest one of all, right in the middle of the path. And there was Ladybug, sitting on a leaf, floating across the puddle like a tiny red boat! \"Ahoy, Pip!\" called Ladybug from her leaf boat. \"Want a ride?\" Pip climbed very carefully onto a big green leaf. Then the breeze pushed him across the puddle, slow and smooth. \"I'm sailing! I'm really sailing!\" Pip sang as he floated all the way to the other side.",
      duration: 18,
      theme: "water",
      character: { emoji: "🐞", position: "top-right" },
      hotspots: [
        { emoji: "🐞", sound: "pop", reaction: "Ladybug!", position: "top-left" },
        { emoji: "🍃", sound: "whoosh", reaction: "A leaf boat!", position: "bottom-left" },
      ],
    },
    {
      text: "By the end of the afternoon, Pip had visited every single puddle in the whole meadow. He had splashed with Duckling, looked at the sky with Snail, and sailed with Ladybug. His little green feet were very tired, but his heart was very full and happy. The sun was getting low and turning the sky orange and pink and gold. All the puddles glowed like little golden lights on the ground. \"What a wonderful puddle parade day,\" Pip whispered happily. Then he hopped slowly back to his mushroom, yawned a great big yawn, and fell fast asleep with a smile on his face.",
      duration: 22,
      theme: "meadow",
      character: { emoji: "🐸", position: "bottom-right" },
      hotspots: [
        { emoji: "🌅", sound: "sparkle", reaction: "Sunset!", position: "top-right" },
        { emoji: "💤", sound: "tap", reaction: "Sleepy frog!", position: "top-left" },
      ],
    },
  ],
  vocab: [
    { word: "puddle", definition: "A small pool of water on the ground after rain.", example: "Pip jumped into the biggest puddle." },
    { word: "splash", definition: "When water jumps up and makes a wet sound.", example: "Duckling loved to splash in the water." },
    { word: "float", definition: "To sit on top of water without sinking.", example: "The leaf boat floated across the puddle." },
  ],
};

for (const ep of [EPISODE_1, EPISODE_2, PIP_EPISODE]) {
  ep.scriptText = ep.scenes.map((s) => s.text).join("\n\n");
}

const ALL_STORIES = [
  {
    title: DEMO_STORY_TITLE,
    storyGoal: "BEDTIME" as const,
    visualStyle: "WATERCOLOR" as const,
    episodes: [EPISODE_1, EPISODE_2],
  },
  {
    title: "Pip's Puddle Parade",
    storyGoal: "ENTERTAIN" as const,
    visualStyle: "CARTOON" as const,
    episodes: [PIP_EPISODE],
  },
];

async function seedStory(
  story: (typeof ALL_STORIES)[number],
  childId: string,
  parentId: string
) {
  const fullText = story.episodes.map((e) => e.scriptText).join("\n\n");
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  const source = await prisma.storySource.create({
    data: {
      parentId,
      sourceType: "TEXT_PASTE",
      title: story.title,
      rawText: fullText,
      wordCount,
      language: "en",
    },
  });

  const storyPack = await prisma.storyPack.create({
    data: {
      sourceId: source.id,
      childProfileId: childId,
      parentId,
      title: story.title,
      storyGoal: story.storyGoal,
      narrationMode: "DEFAULT_TTS",
      visualStyle: story.visualStyle,
      status: "PUBLISHED",
      episodeCount: story.episodes.length,
    },
  });

  for (let i = 0; i < story.episodes.length; i++) {
    const ep = story.episodes[i];
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
          prompt: JSON.stringify(metadata),
          imageUrl: null,
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

  return { storyPackId: storyPack.id, wordCount, episodeCount: story.episodes.length };
}

export async function POST() {
  try {
    const { parentId } = await getDefaultParent();

    const existingChild = await prisma.childProfile.findFirst({
      where: { parentId, name: DEMO_CHILD.name },
    });

    // Clean up old demo stories
    if (existingChild) {
      const oldTitles = ALL_STORIES.map((s) => s.title);
      oldTitles.push("Luna the Little Fox");
      await prisma.storyPack.deleteMany({
        where: {
          parentId,
          childProfileId: existingChild.id,
          title: { in: oldTitles },
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

    const results = [];
    for (const story of ALL_STORIES) {
      const result = await seedStory(story, child.id, parentId);
      results.push({ title: story.title, ...result });
    }

    const totalWords = results.reduce((a, r) => a + r.wordCount, 0);
    const totalEpisodes = results.reduce((a, r) => a + r.episodeCount, 0);

    return Response.json({
      success: true,
      message: `Demo loaded: ${results.length} stories, ${totalEpisodes} episodes, ${totalWords} words`,
      childId: child.id,
      stories: results,
      totalWords,
      totalEpisodes,
    });
  } catch (error) {
    console.error("Demo seed error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
