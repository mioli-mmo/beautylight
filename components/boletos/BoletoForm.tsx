"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function BoletoForm({ boleto }: { boleto?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    id: undefined,
    fornecedor: "",
    descricao: null,
    linha_digitavel: null,
    codigo_barras: null,
    data_emissao: new Date().toISOString().slice(0, 10),
    data_vencimento: null,
    data_pagamento: null,
    valor_total: 0,
    valor_pago: 0,
    status: "aberto",
    parcelas: 1,
    observacoes: null,
    boleto_itens: [] as any[],
  });

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (boleto) {
      setForm((f: any) => ({
        ...f,
        id: boleto.id,
        fornecedor: boleto.fornecedor ?? "",
        descricao: boleto.descricao ?? null,
        linha_digitavel: boleto.linha_digitavel ?? null,
        codigo_barras: boleto.codigo_barras ?? null,
        data_emissao: boleto.data_emissao ?? f.data_emissao,
        data_vencimento: boleto.data_vencimento ?? null,
        data_pagamento: boleto.data_pagamento ?? null,
        valor_total: boleto.valor_total ?? 0,
        valor_pago: boleto.valor_pago ?? 0,
        parcelas: boleto.parcelas ?? 1,
        status: boleto.status ?? "aberto",
        observacoes: boleto.observacoes ?? null,
        boleto_itens: (boleto.boleto_itens ?? []).map((it: any) => ({
          produto_id: it.produto_id,
          produto_nome: it.produto_nome,
          quantidade: it.quantidade,
          custo_unitario: it.custo_unitario,
          aplica_estoque: it.aplica_estoque,
        })),
        boleto_parcelas: (boleto.boleto_parcelas ?? []).map((p: any) => ({
          id: p.id,
          numero: p.numero,
          valor: p.valor,
          data_vencimento: p.data_vencimento,
          data_pagamento: p.data_pagamento,
          status: p.status,
        })),
      }));
    }
  }, [boleto]);

  function parseDecimal(value: string) {
    if (value === null || value === undefined || value === "") return 0;
    return Number(String(value).replace(",", ".")) || 0;
  }

  function addItemFromProduct(produtoId: string) {
    const prod = products.find((p) => p.id === produtoId);
    if (!prod) return;
    setForm((f: any) => ({
      ...f,
      boleto_itens: [
        ...f.boleto_itens,
        { produto_id: prod.id, produto_nome: prod.nome, quantidade: 1, custo_unitario: prod.preco_custo ?? 0, aplica_estoque: true },
      ],
    }));
  }

  function updateItem(index: number, changes: Partial<any>) {
    setForm((f: any) => {
      const items = [...f.boleto_itens];
      items[index] = { ...items[index], ...changes };
      return { ...f, boleto_itens: items };
    });
  }

  function removeItem(index: number) {
    setForm((f: any) => ({ ...f, boleto_itens: f.boleto_itens.filter((_: any, i: number) => i !== index) }));
  }

  function subtotal() {
    return form.boleto_itens.reduce((s: number, it: any) => s + (it.quantidade ?? 0) * (it.custo_unitario ?? 0), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        fornecedor: form.fornecedor,
        descricao: form.descricao ?? null,
        linha_digitavel: form.linha_digitavel ?? null,
        codigo_barras: form.codigo_barras ?? null,
        data_emissao: form.data_emissao ?? new Date().toISOString(),
        data_vencimento: form.data_vencimento,
        data_pagamento: form.data_pagamento ?? null,
        valor_total: subtotal(),
        valor_pago: form.valor_pago ?? 0,
        status: form.status ?? "aberto",
        observacoes: form.observacoes ?? null,
        boleto_itens: form.boleto_itens,
          parcelas: form.parcelas ?? 1,
      };

      if (form.id) {
        await fetch(`/api/boletos/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        router.push("/boletos");
        return;
      } else {
        await fetch(`/api/boletos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        router.refresh();
        setForm({ id: undefined, fornecedor: "", descricao: null, linha_digitavel: null, codigo_barras: null, data_emissao: new Date().toISOString().slice(0, 10), data_vencimento: null, data_pagamento: null, valor_total: 0, valor_pago: 0, status: "aberto", observacoes: null, boleto_itens: [] });
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleParcelaPago(parcela: any) {
    if (!parcela?.id) return;
    const markPaid = parcela.status !== "pago";
    const body = {
      status: markPaid ? "pago" : "pendente",
      data_pagamento: markPaid ? new Date().toISOString() : null,
    };

    await fetch(`/api/boletos/parcelas/${parcela.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-ink/80 md:col-span-2">
          <span className="font-medium text-ink">Fornecedor</span>
          <input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} className="w-full rounded border px-2 py-2" />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Data de emissão</span>
          <input type="date" value={form.data_emissao ?? ""} onChange={(e) => setForm({ ...form, data_emissao: e.target.value })} className="w-full rounded border px-2 py-2" />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Data de vencimento</span>
          <input type="date" value={form.data_vencimento ?? ""} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} className="w-full rounded border px-2 py-2" />
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Parcelas</span>
          <input type="number" min={1} value={form.parcelas ?? 1} onChange={(e) => setForm({ ...form, parcelas: Number(e.target.value) })} className="w-full rounded border px-2 py-2" />
        </label>

        <label className="space-y-1 text-sm text-ink/80 md:col-span-2">
          <span className="font-medium text-ink">Observações</span>
          <input value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="w-full rounded border px-2 py-2" />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <select className="rounded border px-2 py-2" onChange={(e) => addItemFromProduct(e.target.value)}>
            <option value="">Adicionar produto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {p.preco_venda}
              </option>
            ))}
          </select>
        </div>

        {form.boleto_itens.length === 0 && <div className="text-sm text-ink/60">Nenhum item adicionado.</div>}

        <div className="space-y-2">
          {form.boleto_itens.map((it: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="text-sm font-medium">{it.produto_nome}</div>
                <div className="text-xs text-ink/60">Custo unit.: {it.custo_unitario}</div>
              </div>
              <input type="text" inputMode="numeric" pattern="[0-9]*" className="w-20 rounded border px-2 py-1" value={String(it.quantidade)} onChange={(e) => updateItem(i, { quantidade: parseDecimal(e.target.value) })} />
              <input type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" className="w-28 rounded border px-2 py-1" value={String(it.custo_unitario)} onChange={(e) => updateItem(i, { custo_unitario: parseDecimal(e.target.value) })} />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={!!it.aplica_estoque} onChange={(e) => updateItem(i, { aplica_estoque: e.target.checked })} />
                <span className="text-ink/60">Aplica estoque</span>
              </label>
              <button type="button" onClick={() => removeItem(i)} className="text-sm text-red-600">Remover</button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm">Subtotal: R$ {subtotal().toFixed(2)}</div>
        <div className="text-lg font-semibold">Total: R$ {subtotal().toFixed(2)}</div>
      </div>

      {form.boleto_parcelas && form.boleto_parcelas.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Parcelas</h4>
          <div className="space-y-2">
            {form.boleto_parcelas.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div>
                  <div className="font-medium">Parcela {p.numero} — R$ {Number(p.valor ?? 0).toFixed(2)}</div>
                  <div className="text-xs text-ink/60">Venc.: {p.data_vencimento ?? "-"} • Status: {p.status}</div>
                </div>
                <div>
                  <button type="button" onClick={() => toggleParcelaPago(p)} className="text-sm text-brand-600">
                    {p.status === "pago" ? "Estornar" : "Quitar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? "Salvando..." : form.id ? "Salvar" : "Criar boleto"}
        </button>
      </div>
    </form>
  );
}
