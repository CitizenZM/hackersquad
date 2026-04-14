import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { saveImage } from "@/services/upload/file-storage";

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const cartoonStyle = (formData.get("cartoonStyle") as string) || "friendly";
    const assignedName = (formData.get("assignedName") as string) || null;

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const filename = `avatar-${Date.now()}.${ext}`;
    const url = await saveImage(buffer, filename);

    const avatar = await prisma.avatarProfile.create({
      data: {
        parentId,
        imageUrl: url,
        cartoonStyle,
        assignedName,
      },
    });

    return Response.json(avatar, { status: 201 });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
