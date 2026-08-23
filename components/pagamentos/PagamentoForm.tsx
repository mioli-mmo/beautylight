"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function formatDateForInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function addMonths(dateValue: string | null, months: number) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

function buildParcelasBase(total: number, parcelas: number, dataBase: string | null) {
  const count = Math.max(1, Number(parcelas) || 1);
  const totalValue = Number(total) || 0;
  if (totalValue <= 0) return [];

  const valorPorParcela = totalValue / count;
  return Array.from({ length: count }, (_, index) => ({
    id: undefined,
    numero: index + 1,
    valor: index === count - 1 ? Number((totalValue - valorPorParcela * (count - 1)).toFixed(2)) : Number(valorPorParcela.toFixed(2)),
    data_vencimento: dataBase ? addMonths(dataBase, index) : null,
    status: "pendente",
  }));
}

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
    parcelasDetalhes: [] as Array<any>,
  });

  useEffect(() => {
    fetch("/api/vendas")
      .then((r) => r.json())
      .then(setVendas)
      .catch(() => setVendas([]));
  }, []);

  useEffect(() => {
    if (pagamento) {
      const parcelasDetalhes = (pagamento.pagamento_parcelas ?? []).map((parcela: any, index: number) => ({
        id: parcela.id,
        numero: parcela.numero ?? index + 1,
        valor: Number(parcela.valor ?? 0),
        data_vencimento: formatDateForInput(parcela.data_vencimento),
        status: parcela.status ?? "pendente",
      }));

      setForm((f: any) => ({
        ...f,
        ...(pagamento as any),
        parcelas: Number(pagamento.parcelas ?? parcelasDetalhes.length ?? 1),
        data_pagamento: formatDateForInput(pagamento.data_pagamento),
        data_vencimento: formatDateForInput(pagamento.data_vencimento),
        parcelasDetalhes,
      }));
      return;
    }

    if (["fiado", "credito_parcelado"].includes(form.forma)) {
      const nextParcelas = buildParcelasBase(Number(form.valor) || 0, Number(form.parcelas) || 1, form.data_vencimento);
      setForm((f: any) => ({ ...f, parcelasDetalhes: nextParcelas }));
    } else {
      setForm((f: any) => ({ ...f, parcelasDetalhes: [] }));
    }
  }, [pagamento]);

  useEffect(() => {
    if (pagamento) return;
    if (["fiado", "credito_parcelado"].includes(form.forma)) {
      setForm((f: any) => ({
        ...f,
        parcelasDetalhes: buildParcelasBase(Number(f.valor) || 0, Number(f.parcelas) || 1, f.data_vencimento),
      }));
    } else {
      setForm((f: any) => ({ ...f, parcelasDetalhes: [] }));
    }
  }, [form.forma, form.valor, form.parcelas, form.data_vencimento, pagamento]);

  const parseDecimal = (value: string) => {
    if (value === null || value === undefined || value === "") return 0;
    return Number(String(value).replace(",", ".")) || 0;
  };

  function updateParcela(index: number, field: "valor" | "data_vencimento", value: any) {
    setForm((f: any) => ({
      ...f,
      parcelasDetalhes: (f.parcelasDetalhes ?? []).map((parcela: any, parcelaIndex: number) =>
        parcelaIndex === index ? { ...parcela, [field]: field === "valor" ? Number(value ?? 0) : value } : parcela
      ),
    }));
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
        parcelas_detalhes: Array.isArray(form.parcelasDetalhes) ? form.parcelasDetalhes : [],
      };

      if (form.id) {
        await fetch(`/api/pagamentos/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        router.push("/pagamentos");
        return;
      }

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
        parcelasDetalhes: [],
      });
    } finally {
      setSaving(false);
    }
  }

  const renderParcelasEditor = ["fiado", "credito_parcelado"].includes(form.forma);

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
          <input
            type="number"
            value={form.parcelas}
            onChange={(e) => setForm({ ...form, parcelas: Math.max(1, Number(e.target.value) || 1) })}
            className="w-full rounded border px-2 py-2"
          />
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

      {renderParcelasEditor && (
        <div className="rounded border bg-brand-50 p-3">
          <div className="mb-2 text-sm font-medium text-brand-700">Parcelas do pagamento</div>
          <div className="space-y-3">
            {(form.parcelasDetalhes ?? []).map((parcela: any, index: number) => (
              <div key={parcela.id ?? `parcela-${index}`} className="grid grid-cols-1 gap-2 rounded border bg-white p-3 md:grid-cols-3">
                <div className="text-sm font-medium text-ink/80">Parcela {index + 1}</div>

                <label className="text-sm text-ink/80">
                  <span className="mb-1 block">Valor</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={String(parcela.valor ?? 0)}
                    onChange={(e) => updateParcela(index, "valor", parseDecimal(e.target.value))}
                    className="w-full rounded border px-2 py-2"
                  />
                </label>

                <label className="text-sm text-ink/80">
                  <span className="mb-1 block">Vencimento</span>
                  <input
                    type="date"
                    value={parcela.data_vencimento ?? ""}
                    onChange={(e) => updateParcela(index, "data_vencimento", e.target.value || null)}
                    className="w-full rounded border px-2 py-2"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? "Salvando..." : form.id ? "Salvar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
