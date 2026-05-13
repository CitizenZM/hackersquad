import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const DEFAULT_TTL_SEC = Number(process.env.CACHE_DEFAULT_TTL_SEC ?? 86400);

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function cacheKey(kind: string, params: Record<string, unknown>): string {
  const payload = `${kind}|${stableStringify(params)}`;
  return createHash("sha256").update(payload).digest("hex");
}

export interface CachedOptions {
  kind: string;
  params: Record<string, unknown>;
  ttlSec?: number;
  schemaVersion?: number;
  skip?: boolean;
}

export async function cached<T>(
  options: CachedOptions,
  loader: () => Promise<T>
): Promise<T> {
  const skip = options.skip ?? process.env.MOCK_CRAWL === "true";
  if (skip) return loader();

  const key = cacheKey(options.kind, options.params);
  const schemaVersion = options.schemaVersion ?? 1;
  const ttlSec = options.ttlSec ?? DEFAULT_TTL_SEC;

  try {
    const hit = await prisma.crawlCache.findUnique({ where: { cacheKey: key } });
    if (hit && hit.schemaVersion === schemaVersion && hit.expiresAt > new Date()) {
      return hit.payload as T;
    }
  } catch {
    // cache miss on read error — fall through to loader
  }

  const value = await loader();

  try {
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    await prisma.crawlCache.upsert({
      where: { cacheKey: key },
      create: {
        cacheKey: key,
        kind: options.kind,
        schemaVersion,
        payload: value as never,
        expiresAt,
      },
      update: {
        kind: options.kind,
        schemaVersion,
        payload: value as never,
        fetchedAt: new Date(),
        expiresAt,
      },
    });
  } catch {
    // cache write error is non-fatal
  }

  return value;
}

export async function purgeCache(kindOrKey: string): Promise<number> {
  const result = await prisma.crawlCache.deleteMany({
    where: { OR: [{ kind: kindOrKey }, { cacheKey: kindOrKey }] },
  });
  return result.count;
}

export async function purgeExpired(): Promise<number> {
  const result = await prisma.crawlCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
