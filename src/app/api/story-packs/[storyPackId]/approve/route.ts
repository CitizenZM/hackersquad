import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  const { parentId } = await getDefaultParent();

  const { storyPackId } = await params;
  const result = await prisma.storyPack.updateMany({
    where: {
      id: storyPackId,
      parentId: parentId,
      status: "REVIEW_READY",
    },
    data: { status: "PUBLISHED" },
  });

  if (result.count === 0) {
    return Response.json(
      { error: "Story pack not found or not ready for approval" },
      { status: 400 }
    );
  }

  return Response.json({ success: true, status: "PUBLISHED" });
}
