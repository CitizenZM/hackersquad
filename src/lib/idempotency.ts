import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const TTL_HOURS = Number(process.env.IDEMPOTENCY_TTL_HOURS ?? 24);

export interface IdempotencyResult<T> {
  replay: boolean;
  response?: NextResponse;
  commit?: (body: T, status?: number) => Promise<void>;
}

export async function withIdempotency<T>(
  request: Request,
  options: { route: string; projectId?: string }
): Promise<IdempotencyResult<T>> {
  const key = request.headers.get("idempotency-key")?.trim();
  if (!key) {
    return { replay: false, commit: async () => {} };
  }

  const existing = await prisma.idempotencyKey
    .findUnique({ where: { key } })
    .catch(() => null);

  if (existing && existing.expiresAt > new Date()) {
    return {
      replay: true,
      response: NextResponse.json(existing.response as Record<string, unknown>, {
        status: existing.status,
        headers: { "Idempotency-Replay": "true" },
      }),
    };
  }

  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  return {
    replay: false,
    commit: async (body, status = 200) => {
      try {
        await prisma.idempotencyKey.upsert({
          where: { key },
          create: {
            key,
            route: options.route,
            projectId: options.projectId ?? null,
            response: body as never,
            status,
            expiresAt,
          },
          update: {
            route: options.route,
            projectId: options.projectId ?? null,
            response: body as never,
            status,
            expiresAt,
          },
        });
      } catch {
        // non-fatal
      }
    },
  };
}

export async function purgeExpiredIdempotencyKeys(): Promise<number> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
