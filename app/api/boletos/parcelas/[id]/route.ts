import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("boleto_parcelas").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const supabase = await createClient();

  const { data: updated, error: updErr } = await supabase.from("boleto_parcelas").update({
    numero: body.numero ?? undefined,
    valor: body.valor ?? undefined,
    data_vencimento: body.data_vencimento ?? undefined,
    data_pagamento: body.data_pagamento ?? undefined,
    status: body.status ?? undefined,
  }).eq("id", id).select().maybeSingle();

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // atualizar agregados no boleto pai (valor_pago e status)
  try {
    // obter boleto_id
    const boletoId = updated?.boleto_id;
    if (boletoId) {
      const { data: sumRes, error: sumErr } = await supabase.from("boleto_parcelas").select("valor,status").eq("boleto_id", boletoId);
      if (sumErr) return NextResponse.json({ error: sumErr.message }, { status: 500 });

      let valorPago = 0;
      let valorTotal = 0;
      (sumRes ?? []).forEach((p: any) => {
        valorTotal += Number(p.valor ?? 0);
        if ((p.status ?? "pendente") === "pago") valorPago += Number(p.valor ?? 0);
      });

      let novoStatus: any = "aberto";
      if (valorPago >= valorTotal && valorTotal > 0) novoStatus = "pago";
      else if (valorPago > 0) novoStatus = "parcial";

      const { error: updB } = await supabase.from("boletos").update({ valor_pago: valorPago, status: novoStatus }).eq("id", boletoId);
      if (updB) return NextResponse.json({ error: updB.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { error } = await supabase.from("boleto_parcelas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
