import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));

  const scalarFields = [
    "brandPromise", "valueProposition", "toneOfVoice",
    "targetAudience", "pricingTheme", "productCategory", "productDescription",
  ];

  const jsonFields = [
    "useEnvironments", "actorSettings", "displayGuidelines",
    "productFeatures", "ctaLanguage", "socialProof",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of scalarFields) {
    if (field in body) updates[field] = body[field];
  }
  for (const field of jsonFields) {
    if (field in body) updates[field] = body[field];
  }

  const brand = await prisma.brand.update({
    where: { projectId },
    data: updates,
  });

  return NextResponse.json(brand);
}
