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
  /**
   * When false (default), results that are "empty" (null, undefined, an
   * empty array, or a plain object with no own keys) are NOT persisted to
   * the cache — they're still returned to the caller, just not stored, so a
   * transient empty result doesn't poison the cache for the TTL window. Set
   * true to cache empty results anyway (e.g. when an empty result is a
   * meaningful, stable answer for that key).
   */
  cacheEmpty?: boolean;
}

function isEmptyResult(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

// Single-flight de-duplication: if a loader is already in flight for a given
// cache key, concurrent callers await the same promise instead of invoking
// the loader again. Cleaned up once the promise settles (success or failure).
const inFlight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  options: CachedOptions,
  loader: () => Promise<T>
): Promise<T> {
  const skip = options.skip ?? process.env.MOCK_CRAWL === "true";
  if (skip) return loader();

  const key = cacheKey(options.kind, options.params);
  const schemaVersion = options.schemaVersion ?? 1;
  const ttlSec = options.ttlSec ?? DEFAULT_TTL_SEC;
  const cacheEmpty = options.cacheEmpty ?? false;

  try {
    const hit = await prisma.crawlCache.findUnique({ where: { cacheKey: key } });
    if (hit && hit.schemaVersion === schemaVersion && hit.expiresAt > new Date()) {
      return hit.payload as T;
    }
  } catch {
    // cache miss on read error — fall through to loader
  }

  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const loaderPromise = (async () => {
    const value = await loader();

    if (cacheEmpty || !isEmptyResult(value)) {
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
    }

    return value;
  })();

  inFlight.set(key, loaderPromise);
  try {
    return await loaderPromise;
  } finally {
    inFlight.delete(key);
  }
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
