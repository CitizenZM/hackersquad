import { prisma } from "@/lib/db";

const DEFAULT_PARENT_ID = "default-parent";
const DEFAULT_EMAIL = "parent@storynest.local";

let cached: { parentId: string } | null = null;

export async function getDefaultParent(): Promise<{ parentId: string }> {
  if (cached) return cached;

  const existing = await prisma.parentAccount.findUnique({
    where: { id: DEFAULT_PARENT_ID },
  });

  if (existing) {
    cached = { parentId: existing.id };
    return cached;
  }

  const parent = await prisma.parentAccount.create({
    data: {
      id: DEFAULT_PARENT_ID,
      email: DEFAULT_EMAIL,
      passwordHash: "",
      name: "Parent",
    },
  });

  cached = { parentId: parent.id };
  return cached;
}
