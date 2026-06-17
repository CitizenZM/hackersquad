"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-child-bg flex items-center justify-center p-8">
      <div className="text-center space-y-6">
        <div className="text-6xl">😢</div>
        <h2 className="child-title">Oops! Something went wrong</h2>
        <p className="child-body text-foreground/60">
          We couldn&apos;t load this story pack. Let&apos;s try again!
        </p>
        <button
          onClick={reset}
          className="rounded-full bg-child-primary px-8 py-4 text-lg font-semibold text-white shadow-lg active:scale-95 transition-transform"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
