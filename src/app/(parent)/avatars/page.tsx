import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AvatarsPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/login");

  const avatars = await prisma.avatarProfile.findMany({
    where: { parentId: auth.parentId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <ParentHeader
        title="Avatar Studio"
        description="Create a fun storytelling avatar from your photo"
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" /> Parent Avatar (Beta)
            </CardTitle>
            <CardDescription>
              Upload a photo to generate a cartoon avatar that appears during story playback.
              This feature is coming soon — your child will see a friendly default narrator icon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Smile className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Avatar Creator</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Photo upload and cartoon avatar generation will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>

        {avatars.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Avatars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="flex flex-col items-center rounded-lg border p-4"
                  >
                    {avatar.imageUrl ? (
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.assignedName || "Avatar"}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <Smile className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <p className="mt-2 font-medium">{avatar.assignedName || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{avatar.cartoonStyle}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
