// Estado vazio genérico, usado enquanto as listagens não têm dados/lógica.

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-200 bg-white px-6 py-16 text-center">
      <p className="text-sm text-ink/60">{message}</p>
    </div>
  );
}
