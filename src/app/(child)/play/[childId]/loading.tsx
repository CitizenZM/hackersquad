export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-child-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl animate-float">📚</div>
        <p className="child-body text-foreground/60">Loading stories...</p>
      </div>
    </div>
  );
}
