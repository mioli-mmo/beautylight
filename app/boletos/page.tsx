import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { BoletoForm } from "@/components/boletos/BoletoForm";
import { BoletoActions } from "@/components/boletos/BoletoActions";

export default async function BoletosPage() {
  const supabase = await createClient();
  const { data: boletos, error: bError } = await supabase.from("boletos").select("*, boleto_itens(*)").order("data_vencimento", { ascending: false });

  return (
    <>
      <PageHeader title="Boletos" actionLabel="Registrar boleto" />

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {bError ? (
              <p className="text-sm text-red-600">Erro ao buscar boletos: {bError.message}</p>
            ) : !boletos || boletos.length === 0 ? (
              <p className="p-6">Nenhum boleto registrado ainda.</p>
            ) : (
              <div className="space-y-4">
                {boletos.map((b: any) => (
                  <div key={b.id} className="rounded border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{b.fornecedor} — {b.status}</div>
                        <div className="text-sm text-ink/60">Venc.: {b.data_vencimento ? new Date(b.data_vencimento).toLocaleDateString() : "-"}</div>
                        <div className="text-sm text-ink/60">Parcelas: {b.parcelas ?? 1}</div>
                        <div className="text-sm text-ink/60">Itens: {b.boleto_itens?.length ?? 0}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {Number(b.valor_total ?? 0).toFixed(2)}</div>
                        <div className="text-sm text-ink/60">Pago: R$ {Number(b.valor_pago ?? 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-ink/60">Emissão: {b.data_emissao ? new Date(b.data_emissao).toLocaleDateString() : "-"}</div>
                      <div className="flex items-center gap-3">
                        <a href={`/boletos/${b.id}/parcelas`} className="text-sm text-brand-600">
                          Parcelas
                        </a>
                        <BoletoActions id={b.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="rounded border p-4">
              <h3 className="mb-4 text-lg font-medium">Registrar boleto</h3>
              <BoletoForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
