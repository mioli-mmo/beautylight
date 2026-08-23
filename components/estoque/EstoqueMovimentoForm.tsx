"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProdutoResumo = {
  id: string;
  nome: string;
  estoque_atual: number;
};

type MovimentoFormState = {
  id?: string;
  produto_id: string;
  tipo: "ajuste_manual" | "entrada" | "venda";
  quantidade: number;
  observacao: string | null;
};

type DirecaoEstoque = "acrescimo" | "diminuicao";

export function EstoqueMovimentoForm({
  products,
  movement,
}: {
  products: ProdutoResumo[];
  movement?: Partial<MovimentoFormState> & { id?: string };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [direcao, setDirecao] = useState<DirecaoEstoque>("acrescimo");
  const [form, setForm] = useState<MovimentoFormState>({
    produto_id: products[0]?.id ?? "",
    tipo: "ajuste_manual",
    quantidade: 0,
    observacao: "",
  });

  const aplicarDirecao = (valor: number, novaDirecao: DirecaoEstoque) => {
    const magnitude = Math.abs(Number.isFinite(valor) ? valor : 0);
    return novaDirecao === "acrescimo" ? magnitude : -magnitude;
  };

  useEffect(() => {
    if (products.length && !form.produto_id) {
      setForm((prev) => ({ ...prev, produto_id: products[0].id }));
    }

    if (movement) {
      const proximoDirecao = (movement.quantidade ?? 0) >= 0 ? "acrescimo" : "diminuicao";
      setDirecao(proximoDirecao);
      setForm({
        id: movement.id,
        produto_id: movement.produto_id ?? products[0]?.id ?? "",
        tipo: "ajuste_manual",
        quantidade: movement.quantidade ?? 0,
        observacao: movement.observacao ?? "",
      });
    }
  }, [movement, products]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      produto_id: form.produto_id,
      tipo: "ajuste_manual",
      quantidade: Number(form.quantidade),
      observacao: (form.observacao ?? "").trim() || null,
    };

    if (!payload.produto_id) {
      alert("Selecione um produto.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(payload.quantidade) || payload.quantidade === 0) {
      alert("Informe uma quantidade diferente de zero.");
      setSaving(false);
      return;
    }

    try {
      if (form.id) {
        await fetch(`/api/estoque/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/estoque`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      router.refresh();
      if (!form.id) {
        setDirecao("acrescimo");
        setForm({
          produto_id: products[0]?.id ?? "",
          tipo: "ajuste_manual",
          quantidade: 0,
          observacao: "",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  if (products.length === 0) {
    return <p className="text-sm text-ink/60">Cadastre produtos antes de criar ajustes de estoque.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Produto</span>
          <select
            value={form.produto_id}
            onChange={(e) => setForm({ ...form, produto_id: e.target.value })}
            className="w-full rounded border px-2 py-2"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.nome} (estoque: {product.estoque_atual})
              </option>
            ))}
          </select>
          <span className="block text-xs text-ink/60">Selecione o produto que será ajustado.</span>
        </label>

        <div className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Quantidade</span>

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={Math.abs(form.quantidade)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                const valor = Number(raw || 0);
                setForm({ ...form, quantidade: aplicarDirecao(valor, direcao) });
              }}
              placeholder="Ex.: 5"
              className="w-full rounded border px-2 py-2"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDirecao("acrescimo");
                  setForm((prev) => ({ ...prev, quantidade: aplicarDirecao(Math.abs(prev.quantidade), "acrescimo") }));
                }}
                className={`rounded px-3 py-2 text-xs font-medium ${
                  direcao === "acrescimo"
                    ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Acréscimo
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirecao("diminuicao");
                  setForm((prev) => ({ ...prev, quantidade: aplicarDirecao(Math.abs(prev.quantidade), "diminuicao") }));
                }}
                className={`rounded px-3 py-2 text-xs font-medium ${
                  direcao === "diminuicao"
                    ? "bg-red-100 text-red-700 ring-1 ring-red-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Diminuição
              </button>
            </div>
          </div>

          <span className="block text-xs text-ink/60">Digite a quantidade livremente e escolha se é entrada ou saída.</span>
        </div>

        <label className="space-y-1 text-sm text-ink/80">
          <span className="font-medium text-ink">Observação</span>
          <input
            value={form.observacao ?? ""}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            placeholder="Ex.: Quebra, contagem, reposição..."
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
          {saving ? "Salvando..." : form.id ? "Salvar ajuste" : "Registrar ajuste"}
        </button>
      </div>
    </form>
  );
}
