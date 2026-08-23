import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function VendaDetalhesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data: venda } = await supabase
    .from("vendas")
    .select("*, clientes(id,nome), venda_itens(*), pagamentos(*)")
    .eq("id", id)
    .maybeSingle();

  if (!venda) {
    return (
      <>
        <PageHeader title="Detalhes da venda" />
        <div className="p-4 md:p-8">
          <div className="rounded border p-6 text-sm text-ink/70">Venda não encontrada.</div>
        </div>
      </>
    );
  }

  const itemTotal = (venda.venda_itens ?? []).reduce(
    (sum: number, item: any) => sum + Number(item.quantidade ?? 0) * Number(item.preco_unitario ?? 0),
    0,
  );

  return (
    <>
      <PageHeader title="Detalhes da venda" />
      <div className="space-y-6 p-4 md:p-8">
        <div className="rounded border bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-ink/60">Cliente</p>
              <h2 className="text-xl font-semibold text-brand-700">{venda.clientes?.nome ?? "Sem cliente"}</h2>
            </div>

            <div className="flex gap-2">
              <Link href="/vendas" className="rounded border px-3 py-2 text-sm text-ink/80 hover:bg-slate-50">
                Voltar para vendas
              </Link>
              <Link href={`/vendas/${id}`} className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Editar venda
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <InfoBlock label="Data" value={new Date(venda.data_venda).toLocaleString("pt-BR")} />
            <InfoBlock label="Status" value={venda.status ?? "pendente"} />
            <InfoBlock label="Total" value={`R$ ${Number(venda.valor_total ?? 0).toFixed(2)}`} />
            <InfoBlock label="Desconto" value={`R$ ${Number(venda.desconto ?? 0).toFixed(2)}`} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded border bg-white p-4">
            <h3 className="mb-3 text-lg font-medium">Itens da venda</h3>
            <div className="space-y-3">
              {(venda.venda_itens ?? []).length === 0 ? (
                <p className="text-sm text-ink/60">Nenhum item nessa venda.</p>
              ) : (
                (venda.venda_itens ?? []).map((item: any, index: number) => (
                  <div key={`${item.id ?? index}`} className="flex items-center justify-between gap-3 border-b border-brand-100 pb-2 last:border-none last:pb-0">
                    <div>
                      <div className="font-medium">{item.produto_nome}</div>
                      <div className="text-xs text-ink/60">{item.quantidade} x R$ {Number(item.preco_unitario ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="font-medium">R$ {Number((item.quantidade ?? 0) * (item.preco_unitario ?? 0)).toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 border-t pt-3 text-right font-semibold">
              Subtotal: R$ {Number(itemTotal).toFixed(2)}
            </div>
          </div>

          <div className="rounded border bg-white p-4">
            <h3 className="mb-3 text-lg font-medium">Pagamentos</h3>
            <div className="space-y-3">
              {(venda.pagamentos ?? []).length === 0 ? (
                <p className="text-sm text-ink/60">Nenhum pagamento registrado.</p>
              ) : (
                (venda.pagamentos ?? []).map((pagamento: any, index: number) => (
                  <div key={`${pagamento.id ?? index}`} className="rounded border bg-brand-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{pagamento.forma}</div>
                        <div className="text-xs text-ink/60">{pagamento.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {Number(pagamento.valor ?? 0).toFixed(2)}</div>
                        <div className="text-xs text-ink/60">{pagamento.parcelas ?? 1} parcela(s)</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-ink/60">
                      Venc.: {pagamento.data_vencimento ? new Date(pagamento.data_vencimento).toLocaleDateString("pt-BR") : "-"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-brand-50 p-3">
      <p className="text-xs text-ink/60">{label}</p>
      <p className="mt-1 font-medium text-ink">{value}</p>
    </div>
  );
}
