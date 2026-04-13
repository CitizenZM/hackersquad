import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  status?: string;
  description?: string;
  emoji?: string;
}

const statusConfig: Record<string, { color: string; emoji: string }> = {
  DRAFT: { color: "bg-gray-100 text-gray-600", emoji: "📝" },
  RESEARCHING: { color: "bg-blue-100 text-blue-700 animate-pulse", emoji: "🔍" },
  ANALYZED: { color: "bg-green-100 text-green-700", emoji: "✅" },
  GENERATING: { color: "bg-purple-100 text-purple-700 animate-pulse", emoji: "🎨" },
  COMPLETE: { color: "bg-emerald-100 text-emerald-700", emoji: "🎉" },
  ERROR: { color: "bg-red-100 text-red-700", emoji: "😢" },
};

export function Header({ title, status, description, emoji }: HeaderProps) {
  const config = status ? statusConfig[status] : null;

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b-2 border-purple-100 px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          {emoji && <span className="text-2xl">{emoji}</span>}
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-purple-900">
            {title}
          </h1>
          {status && config && (
            <Badge className={`${config.color} rounded-full px-3 py-1 text-xs font-bold`} variant="secondary">
              {config.emoji} {status.charAt(0) + status.slice(1).toLowerCase()}
            </Badge>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-purple-400 font-semibold">{description}</p>
        )}
      </div>
    </div>
  );
}
