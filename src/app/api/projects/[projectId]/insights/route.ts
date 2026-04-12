import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const [insights, patterns, sellingPoints] = await Promise.all([
    prisma.insight.findMany({
      where: { projectId },
      orderBy: { importance: "desc" },
    }),
    prisma.narrativePattern.findMany({
      where: { projectId },
      orderBy: { avgPerformance: "desc" },
    }),
    prisma.sellingPoint.findMany({
      where: { projectId },
      orderBy: { strength: "desc" },
    }),
  ]);

  return NextResponse.json({ insights, patterns, sellingPoints });
}
