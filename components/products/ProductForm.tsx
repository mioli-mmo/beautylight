"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ProductPayload = {
  id?: string;
  nome: string;
  marca?: string;
  preco_custo?: number;
  preco_venda?: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  ativo?: boolean;
};

export function ProductForm({ product }: { product?: Partial<ProductPayload> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductPayload>({
    nome: "",
    marca: "outro",
    preco_custo: 0,
    preco_venda: 0,
    estoque_atual: 0,
    estoque_minimo: 0,
    ativo: true,
  });

  useEffect(() => {
    if (product) {
      setForm((f) => ({ ...f, ...(product as any) }));
    }
  }, [product]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (form.id) {
        await fetch(`/api/produtos/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`/api/produtos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      router.refresh();
      setForm({
        nome: "",
        marca: "outro",
        preco_custo: 0,
        preco_venda: 0,
        estoque_atual: 0,
        estoque_minimo: 0,
        ativo: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Nome do produto</span>
          <input
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex.: Batom Matte Rose"
            className="w-full rounded border px-2 py-2"
          />
          <span className="block text-xs text-ink/60">Nome que será exibido na lista e nas vendas.</span>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Marca</span>
          <select
            value={form.marca}
            onChange={(e) => setForm({ ...form, marca: e.target.value })}
            className="w-full rounded border px-2 py-2"
          >
            <option value="outro">Outro</option>
            <option value="boticario">Boticário</option>
            <option value="natura">Natura</option>
          </select>
          <span className="block text-xs text-ink/60">Selecione a marca principal do produto.</span>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Preço de custo</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={form.preco_custo}
            onChange={(e) => setForm({ ...form, preco_custo: Number(e.target.value) })}
            placeholder="Ex.: 12,50"
            className="w-full rounded border px-2 py-2"
          />
          <span className="block text-xs text-ink/60">Valor pago na compra do item.</span>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Preço de venda</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={form.preco_venda}
            onChange={(e) => setForm({ ...form, preco_venda: Number(e.target.value) })}
            placeholder="Ex.: 29,90"
            className="w-full rounded border px-2 py-2"
          />
          <span className="block text-xs text-ink/60">Valor que será cobrado do cliente.</span>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Estoque atual</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.estoque_atual}
            onChange={(e) => setForm({ ...form, estoque_atual: Number(e.target.value) })}
            placeholder="Ex.: 10"
            className="w-full rounded border px-2 py-2"
          />
          <span className="block text-xs text-ink/60">Quantidade disponível agora em estoque.</span>
        </label>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Estoque mínimo</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.estoque_minimo}
            onChange={(e) => setForm({ ...form, estoque_minimo: Number(e.target.value) })}
            placeholder="Ex.: 3"
            className="w-full rounded border px-2 py-2"
          />
          <span className="block text-xs text-ink/60">Nível mínimo para alerta de estoque baixo.</span>
        </label>

        <label className="flex items-start gap-2 rounded border px-3 py-3 text-sm text-ink/80 md:col-span-2">
          <input
            type="checkbox"
            checked={form.ativo ?? true}
            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            className="mt-1"
          />
          <span>
            <span className="block font-medium text-ink">Produto ativo</span>
            <span className="block text-xs text-ink/60">Desmarque para ocultar o produto das operações sem excluir o cadastro.</span>
          </span>
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
