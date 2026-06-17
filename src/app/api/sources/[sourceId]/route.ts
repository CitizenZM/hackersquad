import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { parentId } = await getDefaultParent();

    const { sourceId } = await params;
    const source = await prisma.storySource.findFirst({
      where: { id: sourceId, parentId: parentId },
    });

    if (!source) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(source);
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { parentId } = await getDefaultParent();

    const { sourceId } = await params;
    const result = await prisma.storySource.deleteMany({
      where: { id: sourceId, parentId: parentId },
    });

    if (result.count === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
