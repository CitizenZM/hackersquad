import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { saveAudio } from "@/services/upload/file-storage";

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    const voiceType = (formData.get("voiceType") as string) || "parent_recording";

    if (!file) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `voice-${Date.now()}.webm`;
    const url = await saveAudio(buffer, filename);

    const profile = await prisma.voiceProfile.create({
      data: {
        parentId,
        voiceType,
        sampleAudioUrl: url,
        status: "READY",
      },
    });

    return Response.json(profile, { status: 201 });
  } catch (error) {
    console.error("Voice upload error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
