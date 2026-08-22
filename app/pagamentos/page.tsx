import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { PagamentoActions } from "@/components/pagamentos/PagamentoActions";

const formaLabels: Record<string, string> = {
  credito_vista: "Crédito à vista",
  credito_parcelado: "Crédito parcelado",
  debito: "Débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
  fiado: "Fiado",
};

function formatForma(f: any) {
  if (!f) return "-";
  return formaLabels[String(f)] ?? String(f).replace(/_/g, " ");
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

function formatStatus(s: any) {
  if (!s) return "-";
  return statusLabels[String(s)] ?? String(s);
}

export default async function PagamentosPage() {
  const supabase = await createClient();
  const { data: pagamentos, error: pagError } = await supabase.from("pagamentos").select("*").order("created_at", { ascending: false });
  const { data: vendas } = await supabase.from("vendas").select("id, cliente_id, valor_total").order("data_venda", { ascending: false });

  return (
    <>
      <PageHeader title="Pagamentos" actionLabel="Registrar pagamento" />

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {pagError ? (
              <p className="text-sm text-red-600">Erro ao buscar pagamentos: {pagError.message}</p>
            ) : !pagamentos || pagamentos.length === 0 ? (
              <p className="p-6">Nenhum pagamento registrado ainda.</p>
            ) : (
              <div className="space-y-4">
                {pagamentos.map((p: any) => (
                  <div key={p.id} className="rounded border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{formatForma(p.forma)} — {formatStatus(p.status)}</div>
                        <div className="text-sm text-ink/60">Pago: {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString() : "-"}</div>
                        <div className="text-sm text-ink/60">Venc.: {p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString() : "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {Number(p.valor ?? 0).toFixed(2)}</div>
                        <div className="text-sm text-ink/60">Venda: {p.venda_id ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-ink/60">Parcelas: {p.parcelas ?? 1}</div>
                      {/* @ts-ignore */}
                      <PagamentoActions id={p.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="rounded border p-4">
              <h3 className="mb-4 text-lg font-medium">Registrar pagamento</h3>
              {/* @ts-expect-error Server component -> client component */}
              <PagamentoForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
