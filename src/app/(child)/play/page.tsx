import { prisma } from "@/lib/db";
import { ProfileSelector } from "./profile-selector";

export const dynamic = "force-dynamic";

export default async function ChildProfileSelectPage() {
  const children = await prisma.childProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, avatarUrl: true },
  });

  const profilesWithStats = await Promise.all(
    children.map(async (child) => {
      const completedEpisodes = await prisma.sessionEvent.count({
        where: { childProfileId: child.id, eventType: "EPISODE_COMPLETE" },
      });
      return { ...child, completedEpisodes };
    })
  );

  return <ProfileSelector profiles={profilesWithStats} />;
}
