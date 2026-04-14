"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, Play, Pause, Trash2, Loader2 } from "lucide-react";

interface VoiceProfileRow {
  id: string;
  voiceType: string;
  sampleAudioUrl: string | null;
  status: string;
  createdAt: string;
}

export function VoiceProfileList({ profiles }: { profiles: VoiceProfileRow[] }) {
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (profiles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Mic className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        No recordings yet — record your first voice sample above.
      </div>
    );
  }

  function togglePlay(profile: VoiceProfileRow) {
    if (!profile.sampleAudioUrl) return;
    if (audioRef.current && playingId === profile.id) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(profile.sampleAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().then(() => setPlayingId(profile.id)).catch(() => setPlayingId(null));
  }

  async function del(profile: VoiceProfileRow) {
    if (!confirm("Delete this voice profile?")) return;
    setDeletingId(profile.id);
    try {
      const res = await fetch(`/api/voices/${profile.id}`, { method: "DELETE" });
      if (res.ok) {
        if (playingId === profile.id && audioRef.current) {
          audioRef.current.pause();
          setPlayingId(null);
        }
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {profiles.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-4 rounded-lg border p-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {p.voiceType === "parent_recording" ? "Parent voice" : p.voiceType}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(p.createdAt).toLocaleString()} &middot;{" "}
              <span
                className={
                  p.status === "READY"
                    ? "text-green-600"
                    : p.status === "FAILED"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {p.status}
              </span>
            </div>
          </div>
          {p.sampleAudioUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePlay(p)}
            >
              {playingId === p.id ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => del(p)}
            disabled={deletingId === p.id}
          >
            {deletingId === p.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
