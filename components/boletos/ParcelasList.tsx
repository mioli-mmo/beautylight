"use client";

import { useEffect, useState } from "react";

export function ParcelasList({ boletoId }: { boletoId: string }) {
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/boletos`);
      if (!r.ok) throw new Error("failed");
      const data = await r.json();
      const b = (data || []).find((x: any) => x.id === boletoId);
      setParcelas(b?.boleto_parcelas ?? []);
    } catch (e) {
      setParcelas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boletoId]);

  async function toggle(p: any) {
    const markPaid = p.status !== "pago";
    const body = {
      status: markPaid ? "pago" : "pendente",
      data_pagamento: markPaid ? new Date().toISOString() : null,
    };

    const res = await fetch(`/api/boletos/parcelas/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      // update local state
      setParcelas((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: body.status, data_pagamento: body.data_pagamento } : x)));
    } else {
      // reload on error
      load();
    }
  }

  if (loading) return <div>Carregando parcelas...</div>;
  if (!parcelas || parcelas.length === 0) return <div>Nenhuma parcela encontrada.</div>;

  return (
    <div className="space-y-2">
      {parcelas.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded border p-3">
          <div>
            <div className="font-medium">Parcela {p.numero} — R$ {Number(p.valor ?? 0).toFixed(2)}</div>
            <div className="text-xs text-ink/60">Venc.: {p.data_vencimento ?? "-"} • Status: {p.status}</div>
          </div>
          <div>
            <button onClick={() => toggle(p)} className="text-sm text-brand-600">
              {p.status === "pago" ? "Estornar" : "Quitar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
