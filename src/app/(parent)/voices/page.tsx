import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";
import { VoiceRecorder } from "@/components/parent/voice-recorder";
import { VoiceProfileList } from "@/components/parent/voice-profile-list";

export const dynamic = "force-dynamic";

export default async function VoicesPage() {
  const { parentId } = await getDefaultParent();

  const voices = await prisma.voiceProfile.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <ParentHeader
        title="Voice Studio"
        description="Record your voice so stories feel like you're reading them"
      />
      <div className="p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Record a Voice Sample
            </CardTitle>
            <CardDescription>
              Read the sample script out loud. We&apos;ll use this to make the
              narrator sound familiar to your child.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoiceRecorder />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Voice Profiles</CardTitle>
            <CardDescription>
              Saved recordings for use in story narration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoiceProfileList
              profiles={voices.map((v) => ({
                id: v.id,
                voiceType: v.voiceType,
                sampleAudioUrl: v.sampleAudioUrl,
                status: v.status,
                createdAt: v.createdAt.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
