"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
