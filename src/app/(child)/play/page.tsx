import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ChildProfileSelectPage() {
  // Show all child profiles - parent shares URL or device
  const children = await prisma.childProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, avatarUrl: true },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-4xl font-bold text-primary">StoryNest</h1>
      <p className="mb-12 text-xl text-muted-foreground">Who&apos;s listening today?</p>

      {children.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          No profiles yet. Ask a parent to set one up!
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/play/${child.id}`}
              className="group flex flex-col items-center gap-3"
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-primary text-4xl font-bold transition-transform group-hover:scale-110 group-hover:shadow-lg">
                {child.avatarUrl ? (
                  <img
                    src={child.avatarUrl}
                    alt={child.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  child.name[0].toUpperCase()
                )}
              </div>
              <span className="text-xl font-semibold">{child.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
