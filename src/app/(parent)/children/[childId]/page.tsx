import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { ChildProfileForm } from "@/components/parent/child-profile-form";

export default async function EditChildPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { parentId } = await getDefaultParent();

  const { childId } = await params;
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId },
  });

  if (!child) notFound();

  return (
    <div>
      <ParentHeader title="Edit Child" description={`Editing ${child.name}'s profile`} />
      <div className="p-6">
        <ChildProfileForm
          initialData={{
            id: child.id,
            name: child.name,
            age: child.age,
            language: child.language,
            interests: child.interests as string[],
            learningMode: child.learningMode,
            pin: child.pin,
          }}
        />
      </div>
    </div>
  );
}
