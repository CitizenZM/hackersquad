import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const sortBy = url.searchParams.get("sortBy") || "overallScore";
  const order = url.searchParams.get("order") || "desc";

  const where: Record<string, unknown> = { projectId };
  if (type) where.type = type;

  const assets = await prisma.contentAsset.findMany({
    where,
    orderBy: { [sortBy]: order },
    include: {
      competitor: { select: { name: true } },
    },
  });

  return NextResponse.json(assets);
}
