import { createClient } from "@/lib/supabase/server";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagamentoParcelasEditor } from "@/components/pagamentos/PagamentoParcelasEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PagamentoEditPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = await createClient();

  // 1. Busca o pagamento principal
  const { data: pagamento, error } = await supabase
    .from("pagamentos")
    .select("*, pagamento_parcelas(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !pagamento) {
    return (
      <>
        <PageHeader title="Editar pagamento" />
        <div className="p-4 md:p-8">
          <p className="text-red-600">Pagamento não encontrado.</p>
        </div>
      </>
    );
  }

  // 2. Tenta recuperar parcelas existentes
  let parcelas = pagamento.pagamento_parcelas ?? [];

  if (!Array.isArray(parcelas) || parcelas.length === 0) {
    const { data: parcelasDireta } = await supabase
      .from("pagamento_parcelas")
      .select("*")
      .eq("pagamento_id", id)
      .order("numero", { ascending: true });

    if (parcelasDireta && parcelasDireta.length > 0) {
      parcelas = parcelasDireta;
    }
  }

  // 3. AUTO-GERAÇÃO: Se for fiado/parcelado e a tabela pagamento_parcelas estiver vazia
  if (
    (!parcelas || parcelas.length === 0) &&
    (pagamento.forma === "fiado" || (pagamento.parcelas && pagamento.parcelas > 0))
  ) {
    const qtdParcelas = Math.max(1, Number(pagamento.parcelas ?? 1));
    const valorTotal = Number(pagamento.valor ?? 0);
    const valorBase = Math.floor((valorTotal / qtdParcelas) * 100) / 100;
    const resto = Number((valorTotal - valorBase * qtdParcelas).toFixed(2));

    const dataInicial = pagamento.data_vencimento
      ? new Date(`${pagamento.data_vencimento}T00:00:00`)
      : new Date();

    const novasParcelas = Array.from({ length: qtdParcelas }, (_, index) => {
      const vencimento = new Date(dataInicial);
      vencimento.setMonth(vencimento.getMonth() + index);

      return {
        pagamento_id: id,
        numero: index + 1,
        valor: index === qtdParcelas - 1 ? Number((valorBase + resto).toFixed(2)) : valorBase,
        data_vencimento: vencimento.toISOString().split("T")[0],
        status: "pendente",
      };
    });

    const { data: parcelasGeradas, error: insertError } = await supabase
      .from("pagamento_parcelas")
      .insert(novasParcelas)
      .select();

    if (!insertError && parcelasGeradas) {
      parcelas = parcelasGeradas;
    }
  }

  // 4. Ordena as parcelas para o editor
  const parcelasOrdenadas = [...parcelas].sort(
    (a: any, b: any) => (a.numero ?? 0) - (b.numero ?? 0)
  );

  const pagamentoCompleto = {
    ...pagamento,
    pagamento_parcelas: parcelasOrdenadas,
  };

  return (
    <>
      <PageHeader title="Editar pagamento" />
      <div className="p-4 md:p-8 space-y-6">
        <div className="rounded border bg-white p-4 shadow-sm">
          <PagamentoForm pagamento={pagamentoCompleto} />
        </div>

        {parcelasOrdenadas.length > 0 && (
          <div className="rounded border bg-white p-4 shadow-sm">
            <PagamentoParcelasEditor pagamento={pagamentoCompleto} />
          </div>
        )}
      </div>
    </>
  );
}