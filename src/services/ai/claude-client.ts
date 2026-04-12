import OpenAI from "openai";
import { z, ZodSchema } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const MODEL = process.env.AI_MODEL || "gpt-4o";

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

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "";

  // Extract JSON from response (handles markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = (jsonMatch[1] || text).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return responseSchema.parse(parsed);
  } catch (parseError) {
    // Retry with a correction prompt
    const retryResponse = await client.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: "You must respond with ONLY valid JSON. No explanation, no markdown. Just the JSON object.",
        },
        { role: "user", content: userPrompt },
        { role: "assistant", content: text },
        {
          role: "user",
          content: `Your previous response was not valid JSON. Please output ONLY the JSON object, nothing else. The error was: ${parseError instanceof Error ? parseError.message : "parse error"}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const retryText = retryResponse.choices[0]?.message?.content || "";
    const retryJsonMatch = retryText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, retryText];
    const retryJsonStr = (retryJsonMatch[1] || retryText).trim();
    const retryParsed = JSON.parse(retryJsonStr);
    return responseSchema.parse(retryParsed);
  }
}
