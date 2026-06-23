import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ACTIVE_WORKSPACE_COOKIE } from "@/services/workspace";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().min(1) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ws = await prisma.workspace.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const res = NextResponse.json({ ok: true, activeId: ws.id });
  res.cookies.set(ACTIVE_WORKSPACE_COOKIE, ws.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
