import { prisma } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = signupSchema.parse(body);

    const existing = await prisma.parentAccount.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const parent = await prisma.parentAccount.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
    });

    const token = await createToken({
      parentId: parent.id,
      email: parent.email,
    });
    await setAuthCookie(token);

    return Response.json({
      id: parent.id,
      email: parent.email,
      name: parent.name,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Signup error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
