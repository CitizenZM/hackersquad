import { prisma } from "@/lib/db";
import { getAuthParent, unauthorized } from "@/lib/auth-middleware";
import { createAvatarSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const avatars = await prisma.avatarProfile.findMany({
    where: { parentId: auth.parentId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(avatars);
}

export async function POST(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();
    const data = createAvatarSchema.parse(body);

    const avatar = await prisma.avatarProfile.create({
      data: {
        parentId: auth.parentId,
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
