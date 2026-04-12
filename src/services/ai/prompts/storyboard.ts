export interface StoryboardInput {
  brandName: string;
  scriptTitle: string;
  scriptBody: string;
  hook: string;
  cta: string;
  style?: string;
}

export function buildStoryboardPrompt(input: StoryboardInput) {
  const system = `You are a creative director creating a visual storyboard for a video ad.
Break the script into 6-8 frames with detailed visual direction.
Respond with ONLY a JSON object:
{
  "title": "string - storyboard title",
  "style": "string - overall visual style description",
  "totalDuration": "string - e.g. 30s",
  "frames": [
    {
      "frameNumber": number,
      "duration": "string - e.g. 3s",
      "scene": "string - what's happening in this scene",
      "visualDirection": "string - camera angle, lighting, composition",
      "voiceover": "string - what's being said",
      "textOverlay": "string - on-screen text if any",
      "cameraNotes": "string - camera movement or transitions",
      "imagePrompt": "string - a detailed prompt for generating this frame as an image"
    }
  ]
}`;

  const user = `Create a storyboard for "${input.brandName}":

Script: ${input.scriptTitle}
Hook: ${input.hook}
Body: ${input.scriptBody}
CTA: ${input.cta}
Visual Style: ${input.style || "Modern, clean, dynamic"}

Break this into 6-8 visual frames with detailed direction for each scene.
Include an imagePrompt for each frame that could be used with an AI image generator.`;

  return { system, user };
}
