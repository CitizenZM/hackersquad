import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const body = await request.json();
    const { token, platform, childId } = body;

    if (!token || !platform) {
      return Response.json({ error: "Token and platform required" }, { status: 400 });
    }

    // Store in session events as a device registration event
    await prisma.sessionEvent.create({
      data: {
        childProfileId: childId || "device-registration",
        storyPackId: "device-registration",
        eventType: "PLAY_START",
        metadata: { deviceToken: token, platform, parentId } as never,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Device registration error:", error);
    return Response.json({ error: "Failed to register device" }, { status: 500 });
  }
}
