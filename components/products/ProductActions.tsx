"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductForm } from "./ProductForm";

export function ProductActions({ product }: { product: any }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir produto?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/produtos/${product.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <div className="w-full">
          <ProductForm product={product} />
          <button
            onClick={() => setEditing(false)}
            className="mt-1 text-sm text-ink/70 underline"
          >
            Fechar
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setEditing(true)}
            className="rounded bg-yellow-100 px-2 py-1 text-xs"
          >
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
