"use client";

import { useRouter } from "next/navigation";

export function VendaActions({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Confirma excluir esta venda?")) return;
    await fetch(`/api/vendas/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function handleEdit() {
    router.push(`/vendas/${id}`);
  }

  function handleDetails() {
    router.push(`/vendas/${id}/detalhes`);
  }

  return (
    <div className="flex gap-2">
      <button onClick={handleDetails} className="text-sm text-brand-600">
        Detalhes
      </button>
      <button onClick={handleEdit} className="text-sm text-brand-600">
        Editar
      </button>
      <button onClick={handleDelete} className="text-sm text-red-600">
        Excluir
      </button>
    </div>
  );
}
