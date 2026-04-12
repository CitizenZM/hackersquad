import { prisma } from "@/lib/db";
import { getAuthParent, unauthorized } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const parent = await prisma.parentAccount.findUnique({
    where: { id: auth.parentId },
    select: { id: true, email: true, name: true, planType: true, createdAt: true },
  });

  if (!parent) return unauthorized();
  return Response.json(parent);
}
