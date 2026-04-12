import { prisma } from "@/lib/db";
import { getAuthParent, unauthorized } from "@/lib/auth-middleware";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const { voiceId } = await params;
  const result = await prisma.voiceProfile.deleteMany({
    where: { id: voiceId, parentId: auth.parentId },
  });

  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
