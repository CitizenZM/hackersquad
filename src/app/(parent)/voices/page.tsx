import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VoicesPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/login");

  const voices = await prisma.voiceProfile.findMany({
    where: { parentId: auth.parentId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <ParentHeader
        title="Voice Studio"
        description="Record your voice to personalize story narration"
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" /> Voice Cloning (Beta)
            </CardTitle>
            <CardDescription>
              Record sample phrases so we can create a voice similar to yours for story narration.
              This feature is in beta — for now, stories use our default AI narrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Mic className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Voice Recording</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Voice recording and cloning will be available soon. Currently, all stories
                use the default AI narrator voice which is warm and child-friendly.
              </p>
            </div>
          </CardContent>
        </Card>

        {voices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Voice Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {voices.map((voice) => (
                  <div
                    key={voice.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{voice.voiceType}</div>
                        <div className="text-xs text-muted-foreground">
                          Status: {voice.status}
                        </div>
                      </div>
                    </div>
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
