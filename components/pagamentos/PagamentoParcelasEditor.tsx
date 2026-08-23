"use client";

import { useState } from "react";

function formatDateForInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function parseDecimal(value: string) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace(",", ".")) || 0;
}

export function PagamentoParcelasEditor({ pagamento }: { pagamento: any }) {
  const [parcelas, setParcelas] = useState<any[]>(() => (pagamento?.pagamento_parcelas ?? []).map((parcela: any) => ({
    ...parcela,
    valor: Number(parcela.valor ?? 0),
    data_vencimento: formatDateForInput(parcela.data_vencimento),
  })));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveParcela(parcela: any) {
    setSavingId(parcela.id);
    setError(null);

    try {
      const res = await fetch(`/api/pagamentos/parcelas/${parcela.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: parcela.valor,
          data_vencimento: parcela.data_vencimento || null,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Não foi possível salvar a parcela.");

      setParcelas((prev) =>
        prev.map((item) =>
          item.id === parcela.id
            ? {
                ...item,
                valor: Number(body?.valor ?? parcela.valor ?? 0),
                data_vencimento: body?.data_vencimento ? formatDateForInput(body.data_vencimento) : parcela.data_vencimento,
              }
            : item
        )
      );
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar parcela.");
    } finally {
      setSavingId(null);
    }
  }

  if (!parcelas.length) return null;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-brand-700">Parcelas do pagamento</h3>
        <p className="text-sm text-ink/60">Edite valor e vencimento de cada parcela individualmente.</p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {parcelas.map((parcela, index) => (
          <div key={parcela.id ?? index} className="rounded border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-ink">Parcela {parcela.numero ?? index + 1}</div>
                <div className="text-xs text-ink/60">Status: {parcela.status ?? "pendente"}</div>
              </div>
              <div className="text-sm text-ink/70">Atual: {formatMoney(Number(parcela.valor ?? 0))}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm text-ink/80 md:col-span-1">
                <span className="font-medium text-ink">Valor</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={String(parcela.valor ?? 0)}
                  onChange={(e) =>
                    setParcelas((prev) =>
                      prev.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, valor: parseDecimal(e.target.value) } : item
                      )
                    )
                  }
                  className="w-full rounded border px-2 py-2"
                />
              </label>

              <label className="space-y-1 text-sm text-ink/80 md:col-span-1">
                <span className="font-medium text-ink">Data de vencimento</span>
                <input
                  type="date"
                  value={parcela.data_vencimento ?? ""}
                  onChange={(e) =>
                    setParcelas((prev) =>
                      prev.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, data_vencimento: e.target.value || null } : item
                      )
                    )
                  }
                  className="w-full rounded border px-2 py-2"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => saveParcela(parcela)}
                  disabled={savingId === parcela.id}
                  className="w-full rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {savingId === parcela.id ? "Salvando..." : "Salvar parcela"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}