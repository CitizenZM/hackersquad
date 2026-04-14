"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Check } from "lucide-react";

export function DemoSeedButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function seed() {
    setState("loading");
    try {
      const res = await fetch("/api/demo-seed", { method: "POST" });
      if (res.ok) {
        setState("done");
        setTimeout(() => {
          router.refresh();
          setState("idle");
        }, 1500);
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  return (
    <Button
      onClick={seed}
      disabled={state !== "idle"}
      variant={state === "done" ? "default" : "outline"}
    >
      {state === "loading" ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading demo...
        </>
      ) : state === "done" ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Demo loaded!
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Load Demo Content
        </>
      )}
    </Button>
  );
}
