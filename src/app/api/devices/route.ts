import { getDefaultParent } from "@/lib/default-parent";

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const body = await request.json();
    const { token, platform } = body;

    if (!token || !platform) {
      return Response.json({ error: "Token and platform required" }, { status: 400 });
    }

    // TODO: Store device token in a dedicated DeviceToken table when
    // server-side push is implemented. For now, log and acknowledge.
    console.log(`Device registered: platform=${platform} parent=${parentId} token=${token.slice(0, 8)}...`);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Device registration error:", error);
    return Response.json({ error: "Failed to register device" }, { status: 500 });
  }
}
