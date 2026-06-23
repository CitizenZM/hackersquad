import { cookies } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ensureDefaultWorkspace } from "@/services/brand-library";

export const ACTIVE_WORKSPACE_COOKIE = "activeWorkspaceId";

export async function listWorkspaces() {
  // Guarantee the default workspace exists so the switcher is never empty.
  await ensureDefaultWorkspace();
  return prisma.workspace.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { projects: true } } },
  });
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace"
  );
}

export async function createWorkspace(name: string) {
  const base = slugify(name);
  // Ensure slug uniqueness with a numeric suffix if needed.
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.workspace.findUnique({ where: { slug } });
    if (!clash) break;
    slug = `${base}-${i}`;
  }
  return prisma.workspace.create({
    data: { name: name.trim() || "Untitled workspace", slug },
  });
}

/**
 * Resolve the active workspace from the cookie, falling back to the default
 * workspace. Always returns a real, existing workspace.
 */
export async function getActiveWorkspace() {
  const fallback = await ensureDefaultWorkspace();
  const store = await cookies();
  const id = store.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  if (!id || id === fallback.id) return fallback;
  const ws = await prisma.workspace.findUnique({ where: { id } });
  return ws ?? fallback;
}

/**
 * Build a project `where` filter for the active workspace.
 *
 * The default workspace also surfaces legacy projects that have no workspace
 * assigned (workspaceId = null), so nothing is ever hidden after this feature
 * ships. Non-default workspaces show only their own projects.
 */
export async function projectWorkspaceFilter(): Promise<Prisma.ProjectWhereInput> {
  const active = await getActiveWorkspace();
  const fallback = await ensureDefaultWorkspace();
  if (active.id === fallback.id) {
    return { OR: [{ workspaceId: active.id }, { workspaceId: null }] };
  }
  return { workspaceId: active.id };
}
