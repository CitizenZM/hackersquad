import Anthropic from "@anthropic-ai/sdk";
import { z, ZodSchema } from "zod";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

export async function analyzeWithClaude<T>(options: {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: ZodSchema<T>;
  maxTokens?: number;
}): Promise<T> {
  if (process.env.MOCK_AI === "true") {
    throw new Error("Mock AI mode - provide mock data at call site");
  }

  const { systemPrompt, userPrompt, responseSchema, maxTokens = 4096 } = options;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Extract JSON from response (handles markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = (jsonMatch[1] || text).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return responseSchema.parse(parsed);
  } catch (parseError) {
    // Retry with a correction prompt
    const retryResponse = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: "You must respond with ONLY valid JSON. No explanation, no markdown. Just the JSON object.",
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: text },
        {
          role: "user",
          content: `Your previous response was not valid JSON. Please output ONLY the JSON object, nothing else. The error was: ${parseError instanceof Error ? parseError.message : "parse error"}`,
        },
      ],
    });

    const retryText = retryResponse.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const retryJsonMatch = retryText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, retryText];
    const retryJsonStr = (retryJsonMatch[1] || retryText).trim();
    const retryParsed = JSON.parse(retryJsonStr);
    return responseSchema.parse(retryParsed);
  }
}
