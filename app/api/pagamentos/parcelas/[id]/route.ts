import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  // 1. Resolve params assíncrono (compatível com Next.js 14 e 15)
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id || id === "undefined") {
    return NextResponse.json(
      { error: "ID da parcela inválido ou não informado." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const supabase = await createClient();

  const novoValor = Number(body.valor ?? 0);
  const dataVencimento = body.data_vencimento ?? null;
  const reorganizarParcelas = body.reorganizar_parcelas ?? true;

  // 2. Busca a parcela sem depender de joins relacionais frágeis
  const { data: parcelaAtual, error: fetchError } = await supabase
    .from("pagamento_parcelas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !parcelaAtual) {
    return NextResponse.json(
      { error: `Parcela não encontrada no banco (ID: ${id}).` },
      { status: 404 }
    );
  }

  const valorAntigo = Number(parcelaAtual.valor ?? 0);
  const diferenca = valorAntigo - novoValor;

  // 3. Atualiza a parcela editada
  const { error: updateError } = await supabase
    .from("pagamento_parcelas")
    .update({
      valor: novoValor,
      data_vencimento: dataVencimento,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // 4. Reorganiza as parcelas restantes se o toggle estiver ativo
  if (reorganizarParcelas && Math.abs(diferenca) > 0.001) {
    let { data: parcelasFuturas } = await supabase
      .from("pagamento_parcelas")
      .select("id, valor, numero")
      .eq("pagamento_id", parcelaAtual.pagamento_id)
      .eq("status", "pendente")
      .gt("numero", parcelaAtual.numero)
      .order("numero", { ascending: true });

    if (!parcelasFuturas || parcelasFuturas.length === 0) {
      const { data: outrasPendentes } = await supabase
        .from("pagamento_parcelas")
        .select("id, valor, numero")
        .eq("pagamento_id", parcelaAtual.pagamento_id)
        .eq("status", "pendente")
        .neq("id", id)
        .order("numero", { ascending: true });

      parcelasFuturas = outrasPendentes;
    }

    if (parcelasFuturas && parcelasFuturas.length > 0) {
      const count = parcelasFuturas.length;
      const diferencaCentavos = Math.round(diferenca * 100);
      const basePorParcelaCentavos = Math.floor(diferencaCentavos / count);
      const restoCentavos = diferencaCentavos - basePorParcelaCentavos * count;

      for (let i = 0; i < count; i++) {
        const p = parcelasFuturas[i];
        const ajusteCentavos =
          basePorParcelaCentavos + (i === count - 1 ? restoCentavos : 0);
        const valorAtualCentavos = Math.round(Number(p.valor) * 100);
        const novoValorCentavos = Math.max(0, valorAtualCentavos + ajusteCentavos);
        const novoValorParcela = Number((novoValorCentavos / 100).toFixed(2));

        await supabase
          .from("pagamento_parcelas")
          .update({ valor: novoValorParcela })
          .eq("id", p.id);
      }
    }
  }

  // 5. Recalcula o total do pagamento pai
  const { data: todasParcelas } = await supabase
    .from("pagamento_parcelas")
    .select("*")
    .eq("pagamento_id", parcelaAtual.pagamento_id)
    .order("numero", { ascending: true });

  if (todasParcelas && todasParcelas.length > 0) {
    const novoTotal = todasParcelas.reduce(
      (acc, p) => acc + Number(p.valor ?? 0),
      0
    );

    await supabase
      .from("pagamentos")
      .update({ valor: Number(novoTotal.toFixed(2)) })
      .eq("id", parcelaAtual.pagamento_id);
  }

  return NextResponse.json({
    success: true,
    parcelas: todasParcelas ?? [],
  });
}