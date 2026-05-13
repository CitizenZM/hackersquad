import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations";
import {
  ensureDefaultWorkspace,
  upsertBrandProfile,
  upsertCompetitorProfile,
} from "@/services/brand-library";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      competitors: { select: { id: true, name: true, url: true } },
      _count: { select: { contentAssets: true, insights: true, scripts: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const workspace = await ensureDefaultWorkspace();
    const brandProfile = await upsertBrandProfile({
      workspaceId: workspace.id,
      name: data.brandName,
      url: data.brandUrl ?? null,
      category: data.category ?? null,
    });

    const competitorProfiles = await Promise.all(
      data.competitors.map((c) =>
        upsertCompetitorProfile({
          workspaceId: workspace.id,
          name: c.name,
          url: c.url ?? null,
        })
      )
    );

    const project = await prisma.project.create({
      data: {
        name: `${data.brandName} Analysis`,
        brandName: data.brandName,
        brandUrl: data.brandUrl || null,
        category: data.category || null,
        campaignGoal: data.campaignGoal || null,
        briefingText: data.briefingText || null,
        workspaceId: workspace.id,
        brandProfileId: brandProfile.id,
        brand: {
          create: {
            name: data.brandName,
            url: data.brandUrl || null,
            brandProfileId: brandProfile.id,
          },
        },
        competitors: {
          create: data.competitors.map((c, i) => ({
            name: c.name,
            url: c.url || null,
            competitorProfileId: competitorProfiles[i].id,
          })),
        },
      },
      include: {
        brand: true,
        competitors: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err }, { status: 400 });
    }
    console.error("Failed to create project:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
