export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <div className="text-sm font-medium text-sina-ink">{title}</div>
      {description && <div className="text-xs text-sina-muted mt-1 max-w-md mx-auto">{description}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
