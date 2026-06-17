import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-52 mt-1" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Children grid — matches sm:grid-cols-2 lg:grid-cols-3 */}
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {/* Avatar circle */}
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-36 mt-0.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
