"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EstoqueMovimentoForm } from "./EstoqueMovimentoForm";

type ProdutoResumo = {
  id: string;
  nome: string;
  estoque_atual: number;
};

type Movimento = {
  id: string;
  produto_id: string;
  tipo: "ajuste_manual" | "entrada" | "venda";
  quantidade: number;
  observacao: string | null;
  created_at: string;
};

export function EstoqueMovimentoActions({
  products,
  movement,
}: {
  products: ProdutoResumo[];
  movement: Movimento;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir este movimento de estoque?")) return;
    setDeleting(true);

    try {
      await fetch(`/api/estoque/${movement.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <div className="w-full">
          <EstoqueMovimentoForm products={products} movement={movement} />
          <button onClick={() => setEditing(false)} className="mt-2 text-sm text-ink/70 underline">
            Fechar
          </button>
        </div>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="rounded bg-yellow-100 px-2 py-1 text-xs">
            Editar
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded bg-red-100 px-2 py-1 text-xs disabled:opacity-60"
          >
            {deleting ? "..." : "Excluir"}
          </button>
        </>
      )}
    </div>
  );
}
