import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { createVoiceProfileSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { parentId } = await getDefaultParent();

  const voices = await prisma.voiceProfile.findMany({
    where: { parentId: parentId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(voices);
}

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const body = await request.json();
    const data = createVoiceProfileSchema.parse(body);

    const voice = await prisma.voiceProfile.create({
      data: {
        parentId: parentId,
        voiceType: data.voiceType,
        sampleAudioUrl: data.sampleAudioUrl,
      },
    });

    return Response.json(voice, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
