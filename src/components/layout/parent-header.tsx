interface ParentHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function ParentHeader({ title, description, action }: ParentHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold sm:text-xl truncate">{title}</h1>
        {description && (
          <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
