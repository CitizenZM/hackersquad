import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile } from "lucide-react";
import { AvatarUploader } from "@/components/parent/avatar-uploader";
import { AvatarProfileList } from "@/components/parent/avatar-profile-list";

export const dynamic = "force-dynamic";

export default async function AvatarsPage() {
  const { parentId } = await getDefaultParent();

  const avatars = await prisma.avatarProfile.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <ParentHeader
        title="Avatar Studio"
        description="Create fun cartoon avatars from photos — use them in stories"
      />
      <div className="p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-4 w-4" />
              Create an Avatar
            </CardTitle>
            <CardDescription>
              Upload a photo or snap one with your camera, then pick a cartoon style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUploader />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Avatars</CardTitle>
            <CardDescription>Saved avatars for use with stories</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarProfileList
              avatars={avatars.map((a) => ({
                id: a.id,
                imageUrl: a.imageUrl,
                cartoonStyle: a.cartoonStyle,
                assignedName: a.assignedName,
                createdAt: a.createdAt.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
