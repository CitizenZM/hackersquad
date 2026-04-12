interface ParentHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function ParentHeader({ title, description, action }: ParentHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-background px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
