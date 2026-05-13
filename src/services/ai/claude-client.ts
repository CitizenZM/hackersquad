import OpenAI from "openai";
import { z, ZodSchema } from "zod";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

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

  // OpenAI requires "json" in the messages when using json_object format
  const systemWithJson = systemPrompt.toLowerCase().includes("json")
    ? systemPrompt
    : systemPrompt + "\n\nRespond with valid JSON only.";

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemWithJson },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "";

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = (jsonMatch[1] || text).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return responseSchema.parse(parsed);
  } catch (parseError) {
    const retryResponse = await getClient().chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: "You must respond with ONLY valid JSON. No explanation, no markdown.",
        },
        { role: "user", content: userPrompt },
        { role: "assistant", content: text },
        {
          role: "user",
          content: `Fix: output valid JSON only. Error: ${parseError instanceof Error ? parseError.message : "parse error"}`,
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
