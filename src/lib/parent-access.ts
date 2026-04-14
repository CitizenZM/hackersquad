import { cookies } from "next/headers";

const PARENT_ACCESS_COOKIE = "storynest-parent";
const DEFAULT_PIN = "1234";

export function getParentPin(): string {
  return process.env.PARENT_PIN || DEFAULT_PIN;
}

export async function hasParentAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PARENT_ACCESS_COOKIE)?.value === "ok";
}

export async function grantParentAccess() {
  const cookieStore = await cookies();
  cookieStore.set(PARENT_ACCESS_COOKIE, "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function revokeParentAccess() {
  const cookieStore = await cookies();
  cookieStore.delete(PARENT_ACCESS_COOKIE);
}

export function verifyPin(pin: string): boolean {
  return pin === getParentPin();
}
