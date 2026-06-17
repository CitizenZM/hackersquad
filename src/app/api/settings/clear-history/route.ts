import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

export async function POST() {
  try {
    const { parentId } = await getDefaultParent();
    const children = await prisma.childProfile.findMany({
      where: { parentId },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);

    const result = await prisma.sessionEvent.deleteMany({
      where: { childProfileId: { in: childIds } },
    });

    return Response.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error("Clear history error:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
