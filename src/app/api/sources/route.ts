import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { createSourceSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { parentId } = await getDefaultParent();

  const sources = await prisma.storySource.findMany({
    where: { parentId: parentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sourceType: true,
      title: true,
      wordCount: true,
      language: true,
      createdAt: true,
      _count: { select: { storyPacks: true } },
    },
  });

  return Response.json(sources);
}

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const body = await request.json();
    const data = createSourceSchema.parse(body);

    const source = await prisma.storySource.create({
      data: {
        parentId: parentId,
        sourceType: data.sourceType,
        title: data.title,
        rawText: data.rawText,
        fileUrl: data.fileUrl,
        wordCount: data.wordCount,
        language: data.language,
      },
    });

    return Response.json(source, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Create source error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
