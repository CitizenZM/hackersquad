import OpenAI from "openai";
import { z, ZodSchema } from "zod";

// Route priority: Matrix (primary) → OpenAI (subscription) → OpenRouter (free).
// All three speak OpenAI's protocol, so they differ only by baseURL, key and
// model id — the SDK client is the same object in each case.
let _client: OpenAI | null = null;
let _provider: "matrix" | "openai" | "openrouter" | null = null;

/**
 * OpenRouter's free tier moves underneath us. This id was verified live on
 * 2026-09-06; the previous default here, meta-llama/llama-3.3-70b-instruct:free,
 * had been retired upstream and answered 404 for every one of the ten-plus API
 * routes that reach this file — silently, because there is no fallback below
 * this layer. Re-check with client-portal's scripts/check-ai-models.mjs.
 */
const OPENROUTER_FREE_DEFAULT = "minimax/minimax-m3:free";

function getClient(): OpenAI {
  if (_client) return _client;

  // Priority 1: Matrix (MoziaVerse) — the primary model.
  const matrixKey = process.env.MATRIX_API_KEY;
  if (matrixKey) {
    _client = new OpenAI({
      apiKey: matrixKey,
      baseURL: process.env.MATRIX_BASE_URL ?? "https://mzsjai.com/v1",
    });
    _provider = "matrix";
    return _client;
  }

  // Priority 2: Direct OpenAI — uses your subscription plan
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    _client = new OpenAI({ apiKey: openaiKey });
    _provider = "openai";
    return _client;
  }

  // Priority 3: OpenRouter free tier
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
    _provider = "openrouter";
    return _client;
  }

  throw new Error("No AI key configured — set MATRIX_API_KEY, OPENAI_API_KEY or OPENROUTER_API_KEY");
}

function getModel(): string {
  // Explicit override always wins
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  getClient();  // resolves _provider, and throws here rather than later if nothing is configured
  switch (_provider) {
    case "matrix":
      // Matrix model ids are account-specific — GET /v1/models lists what a key
      // can reach, and there is no id that can be safely assumed.
      if (!process.env.MATRIX_MODEL) {
        throw new Error("MATRIX_API_KEY is set but MATRIX_MODEL is not — set it to a full id from GET https://mzsjai.com/v1/models");
      }
      return process.env.MATRIX_MODEL;
    case "openai":
      return "gpt-4o";
    case "openrouter":
      return process.env.AI_FALLBACK_MODEL || OPENROUTER_FREE_DEFAULT;
    default:
      return "gpt-4o";
  }
}

/** Thrown when the AI response could not be parsed into the expected schema, even after retry. */
export class AIResponseError extends Error {
  readonly rawText: string;

  constructor(message: string, options: { cause?: unknown; rawText: string }) {
    super(message, { cause: options.cause });
    this.name = "AIResponseError";
    this.rawText = options.rawText.slice(0, 500);
  }
}

/** Extract JSON text from a model response: prefer the LAST fenced code block, else the outermost {...}. */
function extractJsonCandidate(text: string): string {
  const fenceMatches = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
  if (fenceMatches.length > 0) {
    return fenceMatches[fenceMatches.length - 1][1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text.trim();
}

function parseErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "parse error";
}

export async function analyzeWithClaude<T>(options: {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: ZodSchema<T>;
  maxTokens?: number;
  /** Optional per-call model override, e.g. to route heavy tasks to a stronger model. */
  model?: string;
}): Promise<T> {
  const { systemPrompt, userPrompt, responseSchema, maxTokens = 4096, model: modelOverride } = options;

  if (process.env.MOCK_AI === "true") {
    try {
      return responseSchema.parse({});
    } catch (err) {
      throw new Error(
        `MOCK_AI enabled but schema has required fields for this call (systemPrompt: "${systemPrompt.slice(0, 80)}..."). ` +
          `Provide mock data at the call site instead of relying on MOCK_AI. Underlying error: ${parseErrorMessage(err)}`
      );
    }
  }

  const model = modelOverride || getModel();

  // OpenAI requires "json" in the messages when using json_object format
  const systemWithJson = systemPrompt.toLowerCase().includes("json")
    ? systemPrompt
    : systemPrompt + "\n\nRespond with valid JSON only.";

  // json_object response_format: supported by OpenAI-compatible endpoints (OpenAI directly,
  // and OpenRouter passes it through for models that support it). Attempt it on both paths;
  // fall back to an unstructured request if the API rejects the param.
  const client = getClient();
  // All three providers are OpenAI-compatible and accept response_format; the
  // per-model rejection case is already handled by the retry inside callModel.
  const wantsJsonFormat = _provider !== null;

  async function callModel(messages: OpenAI.Chat.ChatCompletionMessageParam[], modelToUse: string) {
    if (wantsJsonFormat) {
      try {
        return await client.chat.completions.create({
          model: modelToUse,
          max_tokens: maxTokens,
          messages,
          response_format: { type: "json_object" },
        });
      } catch (err) {
        // Some OpenRouter models reject response_format — retry without it.
        return await client.chat.completions.create({
          model: modelToUse,
          max_tokens: maxTokens,
          messages,
        });
      }
    }
    return client.chat.completions.create({
      model: modelToUse,
      max_tokens: maxTokens,
      messages,
    });
  }

  const response = await callModel(
    [
      { role: "system", content: systemWithJson },
      { role: "user", content: userPrompt },
    ],
    model
  );

  const text = response.choices[0]?.message?.content || "";
  const jsonStr = extractJsonCandidate(text);

  try {
    const parsed = JSON.parse(jsonStr);
    return responseSchema.parse(parsed);
  } catch (parseError) {
    // Retry with the full original context (not the failed output verbatim) plus a
    // trimmed excerpt of what went wrong, so the model has enough to self-correct
    // without re-spending tokens on the whole failed response.
    const failedExcerpt = text.slice(0, 500);
    const retryResponse = await callModel(
      [
        { role: "system", content: systemWithJson },
        { role: "user", content: userPrompt },
        {
          role: "assistant",
          content: failedExcerpt,
        },
        {
          role: "user",
          content: `Your previous response could not be parsed as valid JSON matching the required schema. Error: ${parseErrorMessage(
            parseError
          )}\n\nRespond again with ONLY valid JSON, no markdown fences, no explanation.`,
        },
      ],
      model
    );

    const retryText = retryResponse.choices[0]?.message?.content || "";
    const retryJsonStr = extractJsonCandidate(retryText);

    try {
      const retryParsed = JSON.parse(retryJsonStr);
      return responseSchema.parse(retryParsed);
    } catch (retryError) {
      throw new AIResponseError(
        `AI response could not be parsed into the expected schema after retry: ${parseErrorMessage(retryError)}`,
        { cause: retryError, rawText: retryText || text }
      );
    }
  }
}
