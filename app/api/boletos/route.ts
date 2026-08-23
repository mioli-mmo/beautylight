import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("boletos").select("*, boleto_itens(*), boleto_parcelas(*)").order("data_vencimento", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payload = {
    fornecedor: body.fornecedor,
    descricao: body.descricao ?? null,
    linha_digitavel: body.linha_digitavel ?? null,
    codigo_barras: body.codigo_barras ?? null,
    data_emissao: body.data_emissao ?? new Date().toISOString(),
    data_vencimento: body.data_vencimento,
    data_pagamento: body.data_pagamento ?? null,
    valor_total: body.valor_total ?? 0,
    valor_pago: body.valor_pago ?? 0,
    parcelas: body.parcelas ?? 1,
    status: body.status ?? "aberto",
    observacoes: body.observacoes ?? null,
  };

  const supabase = await createClient();

  // criar boleto
  const { data: boleto, error: boletoError } = await supabase.from("boletos").insert([payload]).select().single();
  if (boletoError || !boleto) return NextResponse.json({ error: boletoError?.message ?? "Failed to create boleto" }, { status: 500 });

  const boletoId = boleto.id;

  // inserir itens (aplica triggers quando necessário)
  if (Array.isArray(body.boleto_itens) && body.boleto_itens.length > 0) {
    const itens = body.boleto_itens.map((it: any) => ({
      boleto_id: boletoId,
      produto_id: it.produto_id ?? null,
      produto_nome: it.produto_nome,
      quantidade: it.quantidade ?? 0,
      custo_unitario: it.custo_unitario ?? 0,
      aplica_estoque: it.aplica_estoque ?? true,
    }));

    const { error: itensError } = await supabase.from("boleto_itens").insert(itens);
    if (itensError) return NextResponse.json({ error: itensError.message }, { status: 500 });
  }

  // gerar parcelas automaticamente e inserir
  try {
    const num = Number(payload.parcelas) || 1;
    const parcelasArr = generateParcelas(Number(payload.valor_total), num, payload.data_vencimento ?? payload.data_emissao);
    if (parcelasArr.length > 0) {
      const inserts = parcelasArr.map((p) => ({
        boleto_id: boletoId,
        numero: p.numero,
        valor: p.valor,
        data_vencimento: p.data_vencimento,
        status: p.valor === 0 ? "pago" : "pendente",
      }));

      const { error: parcelasError } = await supabase.from("boleto_parcelas").insert(inserts);
      if (parcelasError) return NextResponse.json({ error: parcelasError.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }

  return NextResponse.json({ success: true, boleto_id: boletoId }, { status: 201 });
}

// helper: generate parcelas
function generateParcelas(valorTotal: number, parcelas: number, firstDueDate: string | null) {
  const vals: { numero: number; valor: number; data_vencimento: string | null }[] = [];
  if (!parcelas || parcelas < 1) parcelas = 1;
  const totalCents = Math.round(Number(valorTotal) * 100);
  const base = Math.floor(totalCents / parcelas);
  let acc = 0;
  for (let i = 0; i < parcelas; i++) {
    const numero = i + 1;
    let valorCents = base;
    if (i === parcelas - 1) valorCents = totalCents - acc;
    acc += valorCents;

    // compute due date by adding i months to firstDueDate
    let due: string | null = null;
    if (firstDueDate) {
      const d = new Date(firstDueDate);
      d.setMonth(d.getMonth() + i);
      due = d.toISOString().slice(0, 10);
    }

    vals.push({ numero, valor: valorCents / 100, data_vencimento: due });
  }

  return vals;
}
