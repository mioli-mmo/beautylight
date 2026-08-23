"use client";

import { useRouter } from "next/navigation";

export function BoletoActions({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Confirma excluir este boleto?")) return;
    await fetch(`/api/boletos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function handleEdit() {
    router.push(`/boletos/${id}`);
  }

  return (
    <div className="flex gap-2">
      <button onClick={handleEdit} className="text-sm text-brand-600">
        Editar
      </button>
      <button onClick={handleDelete} className="text-sm text-red-600">
        Excluir
      </button>
    </div>
  );
}
