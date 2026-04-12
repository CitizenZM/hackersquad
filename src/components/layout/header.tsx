import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  status?: string;
  description?: string;
}

export function Header({ title, status, description }: HeaderProps) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    RESEARCHING: "bg-blue-100 text-blue-700",
    ANALYZED: "bg-green-100 text-green-700",
    GENERATING: "bg-purple-100 text-purple-700",
    COMPLETE: "bg-emerald-100 text-emerald-700",
    ERROR: "bg-red-100 text-red-700",
  };

  return (
    <div className="border-b bg-card px-8 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {status && (
          <Badge className={statusColors[status] || ""} variant="secondary">
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
