import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations";

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

    const project = await prisma.project.create({
      data: {
        name: `${data.brandName} Analysis`,
        brandName: data.brandName,
        brandUrl: data.brandUrl || null,
        category: data.category || null,
        campaignGoal: data.campaignGoal || null,
        brand: {
          create: {
            name: data.brandName,
            url: data.brandUrl || null,
          },
        },
        competitors: {
          create: data.competitors.map((c) => ({
            name: c.name,
            url: c.url || null,
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
