import { PageHeader } from "@/components/ui/PageHeader";
import { EstoqueMovimentoForm } from "@/components/estoque/EstoqueMovimentoForm";
import { EstoqueMovimentoActions } from "@/components/estoque/EstoqueMovimentoActions";
import { createClient } from "@/lib/supabase/server";

const LABELS: Record<string, string> = {
  ajuste_manual: "Ajuste manual",
  entrada: "Entrada",
  venda: "Venda",
};

export default async function EstoquePage() {
  const supabase = await createClient();
  const [{ data: produtos, error: produtosError }, { data: movimentos, error: movimentosError }] = await Promise.all([
    supabase.from("produtos").select("*").order("nome"),
    supabase.from("estoque_movimentos").select("*").order("created_at", { ascending: false }),
  ]);

  const produtosMap = new Map((produtos ?? []).map((produto: any) => [produto.id, produto]));

  return (
    <>
      <PageHeader title="Estoque" />

      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-ink/80">Registrar ajuste manual</h2>
          <EstoqueMovimentoForm products={(produtos ?? []) as any[]} />
        </div>

        <h2 className="mb-2 text-sm font-medium text-ink/80">Histórico de estoque</h2>

        {produtosError || movimentosError ? (
          <p className="text-sm text-red-600">
            Erro ao carregar estoque: {produtosError?.message ?? movimentosError?.message}
          </p>
        ) : !movimentos || movimentos.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum movimento de estoque registrado ainda.</p>
        ) : (
          <div className="overflow-auto rounded border bg-white">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-brand-50 text-left text-ink/70">
                <tr>
                  <th className="px-3 py-2">Produto</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Quantidade</th>
                  <th className="px-3 py-2">Observação</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((movimento: any) => {
                  const produto = produtosMap.get(movimento.produto_id);
                  const tipoLabel = LABELS[movimento.tipo] ?? movimento.tipo;

                  return (
                    <tr key={movimento.id} className="border-t">
                      <td className="px-3 py-2">{produto?.nome ?? "Produto removido"}</td>
                      <td className="px-3 py-2">{tipoLabel}</td>
                      <td className={`px-3 py-2 font-medium ${movimento.quantidade > 0 ? "text-green-700" : "text-red-700"}`}>
                        {movimento.quantidade > 0 ? "+" : ""}
                        {movimento.quantidade}
                      </td>
                      <td className="px-3 py-2">{movimento.observacao ?? "—"}</td>
                      <td className="px-3 py-2">{new Date(movimento.created_at).toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2">
                        {movimento.tipo === "venda" ? (
                          <span className="text-xs text-ink/60">Automático</span>
                        ) : (
                          <EstoqueMovimentoActions products={(produtos ?? []) as any[]} movement={movimento} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
