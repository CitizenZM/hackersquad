import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl">📖</div>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground">
          This page doesn&apos;t exist. Maybe the story moved to a different chapter?
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/play"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow"
          >
            Kid Stories
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border px-6 py-2.5 text-sm font-medium shadow-sm"
          >
            Parent Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
