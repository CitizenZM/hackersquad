import { grantParentAccess, verifyPin, revokeParentAccess } from "@/lib/parent-access";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin, action } = body;

    if (action === "logout") {
      await revokeParentAccess();
      return Response.json({ success: true });
    }

    if (!pin || !verifyPin(pin)) {
      return Response.json({ error: "Wrong PIN. Try again!" }, { status: 401 });
    }

    await grantParentAccess();
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
