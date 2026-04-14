"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Smile, Trash2, Loader2 } from "lucide-react";

interface AvatarRow {
  id: string;
  imageUrl: string | null;
  cartoonStyle: string;
  assignedName: string | null;
  createdAt: string;
}

const STYLE_FILTERS: Record<string, string> = {
  friendly: "saturate(1.15) contrast(1.08) brightness(1.05)",
  adventurous: "saturate(1.3) contrast(1.15) hue-rotate(-8deg)",
  dreamy: "saturate(1.1) contrast(0.95) brightness(1.1) hue-rotate(8deg)",
  playful: "saturate(1.4) contrast(1.2) brightness(1.05)",
};

export function AvatarProfileList({ avatars }: { avatars: AvatarRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (avatars.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Smile className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        No avatars yet — upload your first photo above.
      </div>
    );
  }

  async function del(a: AvatarRow) {
    if (!confirm("Delete this avatar?")) return;
    setDeletingId(a.id);
    try {
      const res = await fetch(`/api/avatars/${a.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {avatars.map((a) => (
        <div
          key={a.id}
          className="flex flex-col items-center rounded-lg border p-4 text-center"
        >
          <div
            className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-primary/15 shadow-sm"
            style={{ filter: STYLE_FILTERS[a.cartoonStyle] }}
          >
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.imageUrl}
                alt={a.assignedName || "Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10">
                <Smile className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <p className="mt-3 font-semibold text-sm">
            {a.assignedName || "Unnamed"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{a.cartoonStyle}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => del(a)}
            disabled={deletingId === a.id}
          >
            {deletingId === a.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
