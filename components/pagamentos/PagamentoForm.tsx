"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return typeof dateStr === "string" && dateStr.length >= 10
    ? dateStr.slice(0, 10)
    : "";
}

function filterInteger(value: string): string {
  return value.replace(/\D/g, "");
}

function filterDecimal(value: string): string {
  const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("");
  }
  return cleaned;
}

export function PagamentoForm({ pagamento }: { pagamento?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [form, setForm] = useState({
    id: undefined as string | undefined,
    cliente_id: "",
    forma: "dinheiro",
    valor: "",
    parcelas: "",
    data_vencimento: "",
    data_pagamento: "",
    observacoes: "",
  });

  // Carrega lista de clientes
  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
  }, []);

  // Preenche o formulário buscando o cliente de qualquer uma das origens
  useEffect(() => {
    if (pagamento) {
      const idCliente =
        pagamento.cliente_id ??
        pagamento.vendas?.cliente_id ??
        pagamento.clientes?.id ??
        "";

      setForm({
        id: pagamento.id,
        cliente_id: idCliente ? String(idCliente).trim() : "",
        forma: pagamento.forma ?? "dinheiro",
        valor: pagamento.valor ? String(pagamento.valor) : "",
        parcelas: pagamento.parcelas ? String(pagamento.parcelas) : "",
        data_vencimento: formatDateForInput(pagamento.data_vencimento),
        data_pagamento: formatDateForInput(pagamento.data_pagamento),
        observacoes: pagamento.observacoes ?? "",
      });
    }
  }, [pagamento]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        cliente_id: form.cliente_id || null,
        forma: form.forma,
        valor: Number(form.valor) || 0,
        parcelas: Number(form.parcelas) || 1,
        data_vencimento: form.data_vencimento || null,
        data_pagamento: form.data_pagamento || null,
        observacoes: form.observacoes || null,
      };

      const url = form.id ? `/api/pagamentos/${form.id}` : "/api/pagamentos";
      const method = form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Falha ao salvar pagamento.");
      }

      router.refresh();
      router.push("/pagamentos");
    } catch (error: any) {
      window.alert(error?.message ?? "Erro ao salvar pagamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Cliente</span>
          <select
            value={String(form.cliente_id ?? "").trim()}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            className="w-full rounded border p-2"
          >
            <option value="">-- Selecione um cliente --</option>
            {clients.map((c) => (
              <option key={c.id} value={String(c.id).trim()}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Forma de Pagamento</span>
          <select
            value={form.forma}
            onChange={(e) => setForm({ ...form, forma: e.target.value })}
            className="w-full rounded border p-2"
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito_vista">Crédito à vista</option>
            <option value="credito_parcelado">Crédito parcelado</option>
            <option value="fiado">Fiado</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Valor (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: filterDecimal(e.target.value) })}
            className="w-full rounded border p-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Parcelas</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="1"
            value={form.parcelas}
            onChange={(e) => setForm({ ...form, parcelas: filterInteger(e.target.value) })}
            className="w-full rounded border p-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Data de Vencimento</span>
          <input
            type="date"
            value={form.data_vencimento}
            onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
            className="w-full rounded border p-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Data de Pagamento</span>
          <input
            type="date"
            value={form.data_pagamento}
            onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })}
            className="w-full rounded border p-2"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Observações</span>
        <textarea
          rows={3}
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          className="w-full rounded border p-2"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Salvando..." : form.id ? "Salvar alterações" : "Criar pagamento"}
      </button>
    </form>
  );
}

export default PagamentoForm;