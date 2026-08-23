"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ClientPayload = {
  id?: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
};

export function ClientForm({ client }: { client?: Partial<ClientPayload> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClientPayload>({
    nome: "",
    telefone: null,
    email: null,
    endereco: null,
    observacoes: null,
  });

  useEffect(() => {
    if (client) setForm((f) => ({ ...f, ...(client as any) }));
  }, [client]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (form.id) {
        await fetch(`/api/clientes/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`/api/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      router.refresh();
      setForm({ nome: "", telefone: null, email: null, endereco: null, observacoes: null });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Nome</span>
          <input
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex.: Maria Silva"
            className="w-full rounded border px-2 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Telefone</span>
          <input
            value={form.telefone ?? ""}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder="(99) 99999-9999"
            className="w-full rounded border px-2 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Email</span>
          <input
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplo.com"
            className="w-full rounded border px-2 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Endereço</span>
          <input
            value={form.endereco ?? ""}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            placeholder="Rua, número, bairro"
            className="w-full rounded border px-2 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-ink/80 md:col-span-2">
          <span className="font-medium text-ink">Observações</span>
          <input
            value={form.observacoes ?? ""}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            placeholder="Observações sobre o cliente"
            className="w-full rounded border px-2 py-2"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : form.id ? "Salvar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
