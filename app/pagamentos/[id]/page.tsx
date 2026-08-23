import { createClient } from "@/lib/supabase/server";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagamentoParcelasEditor } from "@/components/pagamentos/PagamentoParcelasEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeParseDate(value: string | null | undefined): Date {
  if (!value) return new Date();

  const dateStr =
    typeof value === "string" && value.length === 10 && !value.includes("T")
      ? `${value}T00:00:00`
      : value;

  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function safeDateToYMD(date: Date): string {
  const d = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function PagamentoEditPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = await createClient();

  // 1. Busca o pagamento principal (sem joins arriscados que causam erro de FK)
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

  // 2. Se não houver cliente_id no pagamento mas houver venda_id, busca o cliente na venda
  let clienteId = pagamento.cliente_id ?? null;

  if (!clienteId && pagamento.venda_id) {
    const { data: venda } = await supabase
      .from("vendas")
      .select("cliente_id")
      .eq("id", pagamento.venda_id)
      .maybeSingle();

    if (venda?.cliente_id) {
      clienteId = venda.cliente_id;
    }
  }

  // 3. Tenta recuperar parcelas existentes
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

  // 4. AUTO-GERAÇÃO: Se for fiado/parcelado e a tabela pagamento_parcelas estiver vazia
  if (
    (!parcelas || parcelas.length === 0) &&
    (pagamento.forma === "fiado" || (pagamento.parcelas && pagamento.parcelas > 0))
  ) {
    const qtdParcelas = Math.max(1, Number(pagamento.parcelas ?? 1));
    const valorTotal = Number(pagamento.valor ?? 0);
    const valorBase = Math.floor((valorTotal / qtdParcelas) * 100) / 100;
    const resto = Number((valorTotal - valorBase * qtdParcelas).toFixed(2));

    const dataInicial = safeParseDate(pagamento.data_vencimento);

    const novasParcelas = Array.from({ length: qtdParcelas }, (_, index) => {
      const vencimento = new Date(dataInicial);
      vencimento.setMonth(vencimento.getMonth() + index);

      return {
        pagamento_id: id,
        numero: index + 1,
        valor: index === qtdParcelas - 1 ? Number((valorBase + resto).toFixed(2)) : valorBase,
        data_vencimento: safeDateToYMD(vencimento),
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

  // 5. Ordena parcelas e monta o objeto completo garantindo o cliente_id
  const parcelasOrdenadas = [...parcelas].sort(
    (a: any, b: any) => (a.numero ?? 0) - (b.numero ?? 0)
  );

  const pagamentoCompleto = {
    ...pagamento,
    cliente_id: clienteId,
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