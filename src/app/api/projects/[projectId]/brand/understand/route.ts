import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const brand = await prisma.brand.findUnique({ where: { projectId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  return NextResponse.json({
    productCategory: brand.productCategory,
    productDescription: brand.productDescription,
    productVerified: brand.productVerified,
    productImages: brand.productImages,
    useEnvironments: brand.useEnvironments,
    actorSettings: brand.actorSettings,
    displayGuidelines: brand.displayGuidelines,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const brand = await prisma.brand.findUnique({ where: { projectId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const environments = (brand.useEnvironments as Array<{ name: string; imagePrompt: string; description: string; typicalUser: string }>) || [];

  // Generate verification images for each environment using Pollinations.ai
  const productImages: Array<{ url: string; caption: string; type: string; environmentName: string }> = [];

  for (const env of environments.slice(0, 3)) {
    if (!env.imagePrompt) continue;
    try {
      const encoded = encodeURIComponent(env.imagePrompt);
      const seed = Math.floor(Math.random() * 999999);
      // Use a HEAD request to verify URL works, then store the URL
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&seed=${seed}&nologo=true&model=flux&enhance=true`;
      const check = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (check.ok) {
        productImages.push({
          url,
          caption: env.name,
          type: "environment",
          environmentName: env.name,
        });
      }
    } catch {
      // skip failed generations
    }
  }

  // Also generate a pure product shot
  const productName = brand.productCategory || brand.name;
  const productShotPrompt = `${brand.productDescription?.slice(0, 200) || productName}, product photography, white background, studio lighting, high detail, no humans, commercial photography style`;
  try {
    const encoded = encodeURIComponent(productShotPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=42&nologo=true&model=flux&enhance=true`;
    const check = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (check.ok) {
      productImages.unshift({ url, caption: "Product Hero Shot", type: "product", environmentName: "" });
    }
  } catch { /* skip */ }

  await prisma.brand.update({
    where: { projectId },
    data: { productImages: productImages as never },
  });

  return NextResponse.json({ productImages, count: productImages.length });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));

  const updateData: Record<string, unknown> = {};
  if ("productVerified" in body) updateData.productVerified = body.productVerified;
  if ("productDescription" in body) updateData.productDescription = body.productDescription;
  if ("productCategory" in body) updateData.productCategory = body.productCategory;
  if ("displayGuidelines" in body) updateData.displayGuidelines = body.displayGuidelines;

  const brand = await prisma.brand.update({
    where: { projectId },
    data: updateData,
  });

  return NextResponse.json(brand);
}
