"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientForm } from "./ClientForm";

export function ClientActions({ client }: { client: any }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir cliente?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/clientes/${client.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <div className="w-full">
          <ClientForm client={client} />
          <button onClick={() => setEditing(false)} className="mt-1 text-sm text-ink/70 underline">
            Fechar
          </button>
        </div>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="rounded bg-yellow-100 px-2 py-1 text-xs">
            Editar
          </button>

          <button onClick={handleDelete} disabled={deleting} className="rounded bg-red-100 px-2 py-1 text-xs disabled:opacity-60">
            {deleting ? "..." : "Excluir"}
          </button>
        </>
      )}
    </div>
  );
}
