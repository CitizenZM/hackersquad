"use client";

import { useState, useCallback } from "react";

interface CachedStory {
  storyPackId: string;
  title: string;
  episodes: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    scriptText: string;
    scenes: Array<{
      sceneOrder: number;
      textSnippet: string;
      prompt: string | null;
      duration: number | null;
    }>;
    vocabWords: Array<{
      word: string;
      definition: string;
      example: string | null;
    }>;
  }>;
}

function isCapacitorAvailable(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).Capacitor;
}

export function useOfflineCache() {
  const [downloading, setDownloading] = useState(false);
  const isNative = typeof window !== "undefined" && isCapacitorAvailable();

  const cacheStory = useCallback(
    async (childId: string, storyPackId: string): Promise<boolean> => {
      if (!isNative) return false;
      setDownloading(true);
      try {
        const { Filesystem, Directory } = await import("@capacitor/filesystem");

        const res = await fetch(`/api/play/${childId}/shelf`);
        const packs = await res.json();
        const pack = packs.find(
          (p: { id: string }) => p.id === storyPackId
        );
        if (!pack) return false;

        const data: CachedStory = {
          storyPackId,
          title: pack.title,
          episodes: pack.episodes,
        };

        await Filesystem.writeFile({
          path: `storynest/stories/${storyPackId}.json`,
          data: JSON.stringify(data),
          directory: Directory.Data,
        });

        return true;
      } catch {
        return false;
      } finally {
        setDownloading(false);
      }
    },
    [isNative]
  );

  const getCachedStory = useCallback(
    async (storyPackId: string): Promise<CachedStory | null> => {
      if (!isNative) return null;
      try {
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const result = await Filesystem.readFile({
          path: `storynest/stories/${storyPackId}.json`,
          directory: Directory.Data,
        });
        return JSON.parse(result.data as string);
      } catch {
        return null;
      }
    },
    [isNative]
  );

  const isOnline = useCallback(async (): Promise<boolean> => {
    if (!isNative) return navigator.onLine;
    try {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      return navigator.onLine;
    }
  }, [isNative]);

  return { cacheStory, getCachedStory, isOnline, downloading, isNative };
}
