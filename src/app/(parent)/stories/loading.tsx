import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-40 mt-1" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Story list */}
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Cover image placeholder */}
                <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3.5 w-64" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
