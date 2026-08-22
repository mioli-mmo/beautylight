import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { VendaForm } from "@/components/vendas/VendaForm";
import { VendaActions } from "@/components/vendas/VendaActions";

export default async function VendasPage() {
  const supabase = await createClient();
  const { data: vendas } = await supabase
    .from("vendas")
    .select("*, clientes(id,nome), venda_itens(*), pagamentos(*)")
    .order("data_venda", { ascending: false });

  return (
    <>
      <PageHeader title="Vendas" actionLabel="Nova venda" />

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {(!vendas || vendas.length === 0) && <div className="p-6">Nenhuma venda registrada ainda.</div>}

            {vendas && vendas.length > 0 && (
              <div className="space-y-4">
                {vendas.map((v: any) => (
                  <div key={v.id} className="rounded border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{v.clientes?.nome ?? "—"}</div>
                        <div className="text-sm text-ink/60">{new Date(v.data_venda).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {Number(v.valor_total).toFixed(2)}</div>
                        <div className="text-sm text-ink/60">{v.status}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-ink/60">{(v.venda_itens ?? []).length} itens</div>
                      <VendaActions id={v.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="rounded border p-4">
              <h3 className="mb-4 text-lg font-medium">Nova venda</h3>
              <VendaForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
