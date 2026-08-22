"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function PagamentoForm({ pagamento }: { pagamento?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [vendas, setVendas] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    id: undefined,
    venda_id: null,
    forma: "dinheiro",
    status: "pendente",
    valor: 0,
    parcelas: 1,
    data_pagamento: null,
    data_vencimento: null,
    observacoes: null,
  });

  useEffect(() => {
    fetch("/api/vendas")
      .then((r) => r.json())
      .then(setVendas)
      .catch(() => setVendas([]));
  }, []);

  useEffect(() => {
    if (pagamento) {
      setForm((f: any) => ({ ...f, ...(pagamento as any) }));
    }
  }, [pagamento]);

  function parseDecimal(value: string) {
    if (value === null || value === undefined || value === "") return 0;
    return Number(String(value).replace(",", ".")) || 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        venda_id: form.venda_id ?? null,
        forma: form.forma,
        status: form.status,
        valor: Number(form.valor) ?? 0,
        parcelas: Number(form.parcelas) ?? 1,
        data_pagamento: form.data_pagamento ?? null,
        data_vencimento: form.data_vencimento ?? null,
        observacoes: form.observacoes ?? null,
      };

      if (form.id) {
        await fetch(`/api/pagamentos/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        router.push("/pagamentos");
        return;
      } else {
        await fetch(`/api/pagamentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        router.refresh();
        setForm({
          id: undefined,
          venda_id: null,
          forma: "dinheiro",
          status: "pendente",
          valor: 0,
          parcelas: 1,
          data_pagamento: null,
          data_vencimento: null,
          observacoes: null,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-ink/80 md:col-span-2">
          <span className="font-medium text-ink">Venda (opcional)</span>
          <select
            value={form.venda_id ?? ""}
            onChange={(e) => setForm({ ...form, venda_id: e.target.value || null })}
            className="w-full rounded border px-2 py-2"
          >
            <option value="">-- Sem venda --</option>
            {vendas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.cliente_id ?? v.id} — R$ {Number(v.valor_total ?? 0).toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Forma</span>
          <select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })} className="w-full rounded border px-2 py-2">
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito_vista">Crédito à vista</option>
            <option value="credito_parcelado">Crédito parcelado</option>
            <option value="fiado">Fiado</option>
          </select>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded border px-2 py-2">
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Valor</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={String(form.valor ?? 0)}
            onChange={(e) => setForm({ ...form, valor: parseDecimal(e.target.value) })}
            className="w-full rounded border px-2 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Parcelas</span>
          <input type="number" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: Number(e.target.value) })} className="w-full rounded border px-2 py-2" />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Data do pagamento</span>
          <input type="date" value={form.data_pagamento ?? ""} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value || null })} className="w-full rounded border px-2 py-2" />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Data de vencimento</span>
          <input type="date" value={form.data_vencimento ?? ""} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value || null })} className="w-full rounded border px-2 py-2" />
        </label>

        <label className="space-y-1 text-sm text-ink/80 md:col-span-2">
          <span className="font-medium text-ink">Observações</span>
          <input value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="w-full rounded border px-2 py-2" />
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? "Salvando..." : form.id ? "Salvar" : "Criar"}
        </button>
      </div>
    </form>
  );

  function parseDecimal(value: string) {
    if (value === null || value === undefined || value === "") return 0;
    return Number(String(value).replace(",", ".")) || 0;
  }
}
