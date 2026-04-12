import { prisma } from "@/lib/db";
import { getAuthParent, unauthorized } from "@/lib/auth-middleware";
import { createVoiceProfileSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const voices = await prisma.voiceProfile.findMany({
    where: { parentId: auth.parentId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(voices);
}

export async function POST(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();
    const data = createVoiceProfileSchema.parse(body);

    const voice = await prisma.voiceProfile.create({
      data: {
        parentId: auth.parentId,
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
