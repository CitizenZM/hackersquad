import { prisma } from "@/lib/db";
import { ProfileSelector } from "./profile-selector";

export const dynamic = "force-dynamic";

export default async function ChildProfileSelectPage() {
  const children = await prisma.childProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, avatarUrl: true },
  });

  return <ProfileSelector profiles={children} />;
}
