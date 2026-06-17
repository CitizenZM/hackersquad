import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { createAvatarSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { parentId } = await getDefaultParent();

  const avatars = await prisma.avatarProfile.findMany({
    where: { parentId: parentId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(avatars);
}

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const body = await request.json();
    const data = createAvatarSchema.parse(body);

    const avatar = await prisma.avatarProfile.create({
      data: {
        parentId: parentId,
        imageUrl: data.imageUrl,
        cartoonStyle: data.cartoonStyle,
        assignedName: data.assignedName,
      },
    });

    return Response.json(avatar, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
