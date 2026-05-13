import { prisma } from "@/lib/db";

const DEFAULT_WORKSPACE_SLUG = "default";
const DEFAULT_WORKSPACE_NAME = "Default workspace";

export async function ensureDefaultWorkspace() {
  const existing = await prisma.workspace.findUnique({
    where: { slug: DEFAULT_WORKSPACE_SLUG },
  });
  if (existing) return existing;
  return prisma.workspace.upsert({
    where: { slug: DEFAULT_WORKSPACE_SLUG },
    update: {},
    create: { slug: DEFAULT_WORKSPACE_SLUG, name: DEFAULT_WORKSPACE_NAME },
  });
}

export async function upsertBrandProfile(input: {
  workspaceId: string;
  name: string;
  url?: string | null;
  category?: string | null;
  crawlPayload?: unknown;
}) {
  return prisma.brandProfile.upsert({
    where: {
      workspaceId_name: { workspaceId: input.workspaceId, name: input.name },
    },
    update: {
      url: input.url ?? undefined,
      category: input.category ?? undefined,
      rawCrawlData: input.crawlPayload as never,
      lastCrawledAt: input.crawlPayload ? new Date() : undefined,
    },
    create: {
      workspaceId: input.workspaceId,
      name: input.name,
      url: input.url ?? null,
      category: input.category ?? null,
      rawCrawlData: input.crawlPayload as never,
      lastCrawledAt: input.crawlPayload ? new Date() : null,
    },
  });
}

export async function upsertCompetitorProfile(input: {
  workspaceId: string;
  name: string;
  url?: string | null;
  crawlPayload?: unknown;
}) {
  return prisma.competitorProfile.upsert({
    where: {
      workspaceId_name: { workspaceId: input.workspaceId, name: input.name },
    },
    update: {
      url: input.url ?? undefined,
      rawCrawlData: input.crawlPayload as never,
      lastCrawledAt: input.crawlPayload ? new Date() : undefined,
    },
    create: {
      workspaceId: input.workspaceId,
      name: input.name,
      url: input.url ?? null,
      rawCrawlData: input.crawlPayload as never,
      lastCrawledAt: input.crawlPayload ? new Date() : null,
    },
  });
}

export async function listBrandProfiles(workspaceId: string) {
  return prisma.brandProfile.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });
}
