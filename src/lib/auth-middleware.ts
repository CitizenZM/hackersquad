import { verifyToken } from "./auth";
import type { AuthPayload } from "./auth";

export async function getAuthParent(
  request: Request
): Promise<AuthPayload | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );

  const token = cookies["storynest-token"];
  if (!token) return null;

  return verifyToken(token);
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
