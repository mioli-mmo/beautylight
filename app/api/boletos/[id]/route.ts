import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("boletos").select("*, boleto_itens(*)").eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const supabase = await createClient();

  // atualizar boleto
  const { data: updated, error: updateError } = await supabase
    .from("boletos")
    .update({
      fornecedor: body.fornecedor,
      descricao: body.descricao ?? null,
      linha_digitavel: body.linha_digitavel ?? null,
      codigo_barras: body.codigo_barras ?? null,
      data_emissao: body.data_emissao ?? new Date().toISOString(),
      data_vencimento: body.data_vencimento,
      data_pagamento: body.data_pagamento ?? null,
      valor_total: body.valor_total ?? 0,
      parcelas: body.parcelas ?? 1,
      valor_pago: body.valor_pago ?? 0,
      status: body.status ?? "aberto",
      observacoes: body.observacoes ?? null,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // substituir itens: excluir existentes e inserir os novos
  const { error: delItensError } = await supabase.from("boleto_itens").delete().eq("boleto_id", id);
  if (delItensError) return NextResponse.json({ error: delItensError.message }, { status: 500 });

  if (Array.isArray(body.boleto_itens) && body.boleto_itens.length > 0) {
    const itens = body.boleto_itens.map((it: any) => ({
      boleto_id: id,
      produto_id: it.produto_id ?? null,
      produto_nome: it.produto_nome,
      quantidade: it.quantidade ?? 0,
      custo_unitario: it.custo_unitario ?? 0,
      aplica_estoque: it.aplica_estoque ?? true,
    }));

    const { error: itensError } = await supabase.from("boleto_itens").insert(itens);
    if (itensError) return NextResponse.json({ error: itensError.message }, { status: 500 });
  }

  // se for enviado campo parcelas, substituir as parcelas existentes
  if (body.parcelas && Number(body.parcelas) >= 1) {
    const num = Number(body.parcelas);
    const { error: delParcError } = await supabase.from("boleto_parcelas").delete().eq("boleto_id", id);
    if (delParcError) return NextResponse.json({ error: delParcError.message }, { status: 500 });

    const parcelasArr = (await (async () => {
      const total = Number(body.valor_total ?? updated.valor_total ?? 0);
      const firstDue = body.data_vencimento ?? updated.data_vencimento ?? (updated.data_emissao ?? null);
      // reuse generateParcelas helper by inlining same logic
      const totalCents = Math.round(total * 100);
      const base = Math.floor(totalCents / num);
      let acc = 0;
      const vals: any[] = [];
      for (let i = 0; i < num; i++) {
        const numero = i + 1;
        let valorCents = base;
        if (i === num - 1) valorCents = totalCents - acc;
        acc += valorCents;
        let due: string | null = null;
        if (firstDue) {
          const d = new Date(firstDue);
          d.setMonth(d.getMonth() + i);
          due = d.toISOString().slice(0, 10);
        }
        vals.push({ numero, valor: valorCents / 100, data_vencimento: due });
      }
      return vals;
    })());

    if (parcelasArr.length > 0) {
      const inserts = parcelasArr.map((p: any) => ({ boleto_id: id, numero: p.numero, valor: p.valor, data_vencimento: p.data_vencimento, status: p.valor === 0 ? "pago" : "pendente" }));
      const { error: parcInsErr } = await supabase.from("boleto_parcelas").insert(inserts);
      if (parcInsErr) return NextResponse.json({ error: parcInsErr.message }, { status: 500 });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();

  const { error: delItensError } = await supabase.from("boleto_itens").delete().eq("boleto_id", id);
  if (delItensError) return NextResponse.json({ error: delItensError.message }, { status: 500 });

  const { error } = await supabase.from("boletos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
