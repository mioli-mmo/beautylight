// Cabeçalho padrão de cada página de listagem (título + ação principal).
// Skeleton: o botão de ação ainda não dispara nenhuma função.

export function PageHeader({
  title,
  actionLabel,
}: {
  title: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-brand-200 px-4 py-4 md:px-8">
      <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>

      {actionLabel && (
        <button
          type="button"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
