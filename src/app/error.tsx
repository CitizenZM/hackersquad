"use client";

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl">😅</div>
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground">
          Don&apos;t worry, these things happen. Let&apos;s try again!
        </p>
        <button
          onClick={reset}
          className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
