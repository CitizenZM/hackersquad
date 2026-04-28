import { NextResponse } from "next/server";

export const maxDuration = 30;

const VEO_MODELS = {
  "veo-3.1-lite": "veo-3.1-lite-generate-preview",
  "veo-3.1-fast": "veo-3.1-fast-generate-preview",
  "veo-3.1-standard": "veo-3.1-generate-preview",
  "veo-3": "veo-3.0-generate-001",
  "veo-3-fast": "veo-3.0-fast-generate-001",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { prompt, model, aspectRatio, resolution } = body as {
    prompt: string;
    model?: string;
    aspectRatio?: string;
    resolution?: string;
  };

  if (!prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google API key not configured" }, { status: 500 });
  }

  const modelId = VEO_MODELS[model as keyof typeof VEO_MODELS] || VEO_MODELS["veo-3.1-fast"];

  try {
    // Call Veo API via REST (faster than SDK for serverless)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            aspectRatio: aspectRatio || "9:16",
            resolution: resolution || "720p",
            durationSeconds: 8,
            personGeneration: "allow_adult",
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Veo API error:", err);
      return NextResponse.json(
        { error: `Veo API error: ${res.status}`, details: err },
        { status: res.status }
      );
    }

    const data = await res.json();
    const operationName = data.name;

    if (!operationName) {
      return NextResponse.json({ error: "No operation returned" }, { status: 500 });
    }

    return NextResponse.json({
      operationId: operationName,
      model: modelId,
      projectId,
      status: "generating",
    });
  } catch (err) {
    console.error("Video generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
