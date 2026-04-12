import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  status?: string;
  description?: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  RESEARCHING: "bg-blue-100 text-blue-700 animate-pulse",
  ANALYZED: "bg-green-100 text-green-700",
  GENERATING: "bg-purple-100 text-purple-700 animate-pulse",
  COMPLETE: "bg-emerald-100 text-emerald-700",
  ERROR: "bg-red-100 text-red-700",
};

export function Header({ title, status, description }: HeaderProps) {
  return (
    <div className="border-b bg-card px-4 py-4 sm:px-6 md:px-8 md:py-6">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
        {status && (
          <Badge className={statusColors[status] || ""} variant="secondary">
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
