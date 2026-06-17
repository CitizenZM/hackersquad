import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 sm:px-6 sm:py-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-72 mt-1" />
      </div>

      <div className="p-6 space-y-6">
        {/* Family overview card (shown when > 1 child) */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Per-child progress card */}
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-28 rounded-md flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stat boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="rounded-lg border p-3 space-y-2">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-6 w-10" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>

              {/* Weekly activity chart placeholder */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>

              {/* Recent activity section */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full rounded-lg" />
                ))}
              </div>

              {/* Footer stats row */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="text-center space-y-1">
                    <Skeleton className="h-5 w-10 mx-auto" />
                    <Skeleton className="h-3 w-24 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
