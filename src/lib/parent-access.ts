import { cookies } from "next/headers";
import { randomInt } from "crypto";

const PARENT_ACCESS_COOKIE = "storynest-parent";
let _generatedPin: string | undefined;

export function getParentPin(): string {
  if (process.env.PARENT_PIN) {
    return process.env.PARENT_PIN;
  }
  if (!_generatedPin) {
    _generatedPin = String(randomInt(100000, 1000000));
  }
  return _generatedPin;
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
