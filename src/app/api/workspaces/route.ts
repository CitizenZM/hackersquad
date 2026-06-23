import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ACTIVE_WORKSPACE_COOKIE,
  createWorkspace,
  getActiveWorkspace,
  listWorkspaces,
} from "@/services/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  const [workspaces, active] = await Promise.all([
    listWorkspaces(),
    getActiveWorkspace(),
  ]);
  return NextResponse.json({ workspaces, activeId: active.id });
}

const createSchema = z.object({ name: z.string().min(1).max(60) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  const ws = await createWorkspace(parsed.data.name);
  const res = NextResponse.json({ workspace: ws }, { status: 201 });
  // Switch to the freshly created workspace.
  res.cookies.set(ACTIVE_WORKSPACE_COOKIE, ws.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
