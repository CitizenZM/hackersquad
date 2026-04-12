import OpenAI from "openai";
import { saveImage } from "@/services/upload/file-storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function generateImage(
  prompt: string,
  identifier?: string
): Promise<string> {
  if (process.env.MOCK_AI === "true") {
    return `/uploads/images/mock-${identifier || "test"}.png`;
  }

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image URL returned from DALL-E");

  const imageResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const filename = `scene-${identifier || Date.now()}.png`;
  return saveImage(buffer, filename);
}

export async function generateCoverImage(
  title: string,
  visualStyle: string
): Promise<string> {
  const styleMap: Record<string, string> = {
    CARTOON: "cute cartoon style, bright and colorful",
    WATERCOLOR: "soft watercolor painting, gentle pastels",
    STORYBOOK: "classic storybook illustration, warm and detailed",
    PIXEL_ART: "cute pixel art style, colorful retro",
  };

  const styleDesc = styleMap[visualStyle] || styleMap.CARTOON;
  const prompt = `Children's story book cover, ${styleDesc}, title "${title}", child-friendly, safe for ages 3-9, warm and inviting, no text overlay`;

  return generateImage(prompt, `cover-${Date.now()}`);
}
