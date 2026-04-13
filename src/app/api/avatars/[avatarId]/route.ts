import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ avatarId: string }> }
) {
  const { parentId } = await getDefaultParent();

  const { avatarId } = await params;
  const result = await prisma.avatarProfile.deleteMany({
    where: { id: avatarId, parentId: parentId },
  });

  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
