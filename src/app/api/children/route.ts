import { prisma } from "@/lib/db";
import { getAuthParent, unauthorized } from "@/lib/auth-middleware";
import { createChildSchema } from "@/lib/validations";
import { ageToAgeGroup } from "@/lib/constants";

export async function GET(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const children = await prisma.childProfile.findMany({
    where: { parentId: auth.parentId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(children);
}

export async function POST(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();
    const data = createChildSchema.parse(body);

    const child = await prisma.childProfile.create({
      data: {
        parentId: auth.parentId,
        name: data.name,
        age: data.age,
        ageGroup: ageToAgeGroup(data.age),
        language: data.language,
        interests: data.interests,
        learningMode: data.learningMode,
        pin: data.pin,
      },
    });

    return Response.json(child, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Create child error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
