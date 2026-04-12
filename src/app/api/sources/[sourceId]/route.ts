import { prisma } from "@/lib/db";
import { getAuthParent, unauthorized } from "@/lib/auth-middleware";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const { sourceId } = await params;
  const source = await prisma.storySource.findFirst({
    where: { id: sourceId, parentId: auth.parentId },
  });

  if (!source) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(source);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const { sourceId } = await params;
  const result = await prisma.storySource.deleteMany({
    where: { id: sourceId, parentId: auth.parentId },
  });

  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
