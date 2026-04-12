import { prisma } from "@/lib/db";
import { createSessionEventSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSessionEventSchema.parse(body);

    const event = await prisma.sessionEvent.create({
      data: {
        childProfileId: data.childProfileId,
        storyPackId: data.storyPackId,
        episodeId: data.episodeId,
        eventType: data.eventType,
        duration: data.duration,
        metadata: (data.metadata ?? undefined) as never,
      },
    });

    return Response.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Session event error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
