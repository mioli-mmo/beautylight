"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Item = {
  produto_id?: string | null;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
};

type Pagamento = {
  forma: string;
  valor: number;
  parcelas?: number;
};

export function VendaForm({ venda }: { venda?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    id: undefined,
    cliente_id: null,
    desconto: 0,
    observacoes: null,
    venda_itens: [] as Item[],
    pagamentos: [] as Pagamento[],
  });

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => setClients([]));

    fetch("/api/produtos")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (venda) {
      setForm((f: any) => ({
        ...f,
        id: venda.id,
        cliente_id: venda.cliente_id ?? null,
        desconto: venda.desconto ?? 0,
        observacoes: venda.observacoes ?? null,
        venda_itens: (venda.venda_itens ?? []).map((it: any) => ({
          produto_id: it.produto_id,
          produto_nome: it.produto_nome,
          quantidade: it.quantidade,
          preco_unitario: it.preco_unitario,
        })),
        pagamentos: venda.pagamentos ?? [],
      }));
    }
  }, [venda]);

  function parseDecimal(value: string) {
    if (value === null || value === undefined || value === "") return 0;
    return Number(String(value).replace(",", ".")) || 0;
  }

  function addItemFromProduct(produtoId: string) {
    const prod = products.find((p) => p.id === produtoId);
    if (!prod) return;
    setForm((f: any) => ({
      ...f,
      venda_itens: [
        ...f.venda_itens,
        { produto_id: prod.id, produto_nome: prod.nome, quantidade: 1, preco_unitario: prod.preco_venda },
      ],
    }));
  }

  function updateItem(index: number, changes: Partial<Item>) {
    setForm((f: any) => {
      const items = [...f.venda_itens];
      items[index] = { ...items[index], ...changes };
      return { ...f, venda_itens: items };
    });
  }

  function removeItem(index: number) {
    setForm((f: any) => ({ ...f, venda_itens: f.venda_itens.filter((_: any, i: number) => i !== index) }));
  }

  function subtotal() {
    return form.venda_itens.reduce((s: number, it: Item) => s + it.quantidade * it.preco_unitario, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        cliente_id: form.cliente_id ?? null,
        data_venda: new Date().toISOString(),
        status: "pendente",
        valor_total: subtotal() - (form.desconto ?? 0),
        desconto: form.desconto ?? 0,
        observacoes: form.observacoes ?? null,
        venda_itens: form.venda_itens,
        pagamentos: form.pagamentos,
      };

      if (form.id) {
        await fetch(`/api/vendas/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // after editing, redirect back to vendas list
        router.push("/vendas");
        return;
      } else {
        await fetch(`/api/vendas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        router.refresh();
        // reset form
        setForm({ id: undefined, cliente_id: null, desconto: 0, observacoes: null, venda_itens: [], pagamentos: [] });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm text-ink/80 md:col-span-2">
          <span className="font-medium text-ink">Cliente (opcional)</span>
          <select
            value={form.cliente_id ?? ""}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value || null })}
            className="w-full rounded border px-2 py-2"
          >
            <option value="">-- Sem cliente --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Desconto</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={String(form.desconto ?? 0)}
            onChange={(e) => setForm({ ...form, desconto: parseDecimal(e.target.value) })}
            className="w-full rounded border px-2 py-2"
          />
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

        {form.venda_itens.length === 0 && <div className="text-sm text-ink/60">Nenhum item adicionado.</div>}

        <div className="space-y-2">
          {form.venda_itens.map((it: Item, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="text-sm font-medium">{it.produto_nome}</div>
                <div className="text-xs text-ink/60">Preço unit.: {it.preco_unitario}</div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-20 rounded border px-2 py-1"
                value={String(it.quantidade)}
                onChange={(e) => updateItem(i, { quantidade: parseDecimal(e.target.value) })}
              />
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                className="w-28 rounded border px-2 py-1"
                value={String(it.preco_unitario)}
                onChange={(e) => updateItem(i, { preco_unitario: parseDecimal(e.target.value) })}
              />
              <button type="button" onClick={() => removeItem(i)} className="text-sm text-red-600">
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm">Subtotal: {subtotal().toFixed(2)}</div>
        <div className="text-sm">Desconto: {Number(form.desconto ?? 0).toFixed(2)}</div>
        <div className="text-lg font-semibold">Total: {(subtotal() - (form.desconto ?? 0)).toFixed(2)}</div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : form.id ? "Salvar venda" : "Criar venda"}
        </button>
      </div>
    </form>
  );
}
