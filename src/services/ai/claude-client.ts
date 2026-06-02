import OpenAI from "openai";
import { z, ZodSchema } from "zod";

// Route: OpenRouter (free tier) → OpenAI fallback
// Set OPENROUTER_API_KEY to use free models via OpenRouter.
// Set AI_MODEL to override the model (default: openrouter/free auto-router).
// Falls back to OPENAI_API_KEY + gpt-4o-mini if OpenRouter key is absent.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    _client = new OpenAI({
      apiKey: openrouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://creativeintel.vercel.app",
        "X-Title": "CreativeIntel OS",
      },
    });
    return _client;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is set");
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

function getModel(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (process.env.OPENROUTER_API_KEY) return "openrouter/free";
  return "gpt-4o-mini";
}

const MODEL = getModel();

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

  // json_object response_format is OpenAI-specific; OpenRouter free models ignore it
  const useJsonFormat = !process.env.OPENROUTER_API_KEY;
  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemWithJson },
      { role: "user", content: userPrompt },
    ],
    ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
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
      ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
    });

    const retryText = retryResponse.choices[0]?.message?.content || "";
    const retryJsonMatch = retryText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, retryText];
    const retryJsonStr = (retryJsonMatch[1] || retryText).trim();
    const retryParsed = JSON.parse(retryJsonStr);
    return responseSchema.parse(retryParsed);
  }
}
