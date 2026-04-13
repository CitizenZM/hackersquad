import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { updateChildSchema } from "@/lib/validations";
import { ageToAgeGroup } from "@/lib/constants";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { parentId } = await getDefaultParent();

  const { childId } = await params;
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId: parentId },
  });

  if (!child) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(child);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { parentId } = await getDefaultParent();

  const { childId } = await params;

  try {
    const body = await request.json();
    const data = updateChildSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.age !== undefined) {
      updateData.ageGroup = ageToAgeGroup(data.age);
    }

    const child = await prisma.childProfile.updateMany({
      where: { id: childId, parentId: parentId },
      data: updateData,
    });

    if (child.count === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.childProfile.findUnique({ where: { id: childId } });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Update child error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { parentId } = await getDefaultParent();

  const { childId } = await params;
  const result = await prisma.childProfile.deleteMany({
    where: { id: childId, parentId: parentId },
  });

  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
