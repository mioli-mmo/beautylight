import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendas")
    .select("*, clientes(id,nome), venda_itens(*), pagamentos(*)")
    .order("data_venda", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payload = {
    cliente_id: body.cliente_id ?? null,
    data_venda: body.data_venda ?? new Date().toISOString(),
    status: body.status ?? "pendente",
    valor_total: body.valor_total ?? 0,
    desconto: body.desconto ?? 0,
    observacoes: body.observacoes ?? null,
  };

  const supabase = await createClient();

  // criar venda
  const { data: venda, error: vendaError } = await supabase.from("vendas").insert([payload]).select().single();
  if (vendaError || !venda) return NextResponse.json({ error: vendaError?.message ?? "Failed to create venda" }, { status: 500 });

  const vendaId = venda.id;

  // inserir itens (depois do insert para disparar triggers de estoque)
  if (Array.isArray(body.venda_itens) && body.venda_itens.length > 0) {
    const itens = body.venda_itens.map((it: any) => ({
      venda_id: vendaId,
      produto_id: it.produto_id ?? null,
      produto_nome: it.produto_nome,
      quantidade: it.quantidade ?? 0,
      preco_unitario: it.preco_unitario ?? 0,
    }));

    const { error: itensError } = await supabase.from("venda_itens").insert(itens);
    if (itensError) return NextResponse.json({ error: itensError.message }, { status: 500 });
  }

  // inserir pagamentos, se houver
  if (Array.isArray(body.pagamentos) && body.pagamentos.length > 0) {
    const pagamentos = body.pagamentos.map((p: any) => ({
      venda_id: vendaId,
      forma: p.forma,
      status: p.status ?? "pendente",
      valor: p.valor ?? 0,
      parcelas: p.parcelas ?? 1,
      data_pagamento: p.data_pagamento ?? null,
      data_vencimento: p.data_vencimento ?? null,
      observacoes: p.observacoes ?? null,
    }));

    const { error: pagamentosError } = await supabase.from("pagamentos").insert(pagamentos);
    if (pagamentosError) return NextResponse.json({ error: pagamentosError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, venda_id: vendaId }, { status: 201 });
}
