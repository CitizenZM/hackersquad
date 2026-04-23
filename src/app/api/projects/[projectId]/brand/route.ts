import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();

  const allowedFields = [
    "brandPromise", "valueProposition", "toneOfVoice",
    "targetAudience", "pricingTheme",
  ];

  const updates: Record<string, string> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const brand = await prisma.brand.update({
    where: { projectId },
    data: updates,
  });

  return NextResponse.json(brand);
}
