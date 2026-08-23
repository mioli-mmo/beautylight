import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendas")
    .select("*, clientes(id,nome), venda_itens(*), pagamentos(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const supabase = await createClient();

  // atualizar venda
  const { data: updated, error: updateError } = await supabase
    .from("vendas")
    .update({
      cliente_id: body.cliente_id ?? null,
      data_venda: body.data_venda ?? new Date().toISOString(),
      status: body.status ?? "pendente",
      valor_total: body.valor_total ?? 0,
      desconto: body.desconto ?? 0,
      observacoes: body.observacoes ?? null,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // substituir itens: excluir existentes e inserir os novos (dispara triggers)
  const { error: delItensError } = await supabase.from("venda_itens").delete().eq("venda_id", id);
  if (delItensError) return NextResponse.json({ error: delItensError.message }, { status: 500 });

  if (Array.isArray(body.venda_itens) && body.venda_itens.length > 0) {
    const itens = body.venda_itens.map((it: any) => ({
      venda_id: id,
      produto_id: it.produto_id ?? null,
      produto_nome: it.produto_nome,
      quantidade: it.quantidade ?? 0,
      preco_unitario: it.preco_unitario ?? 0,
    }));

    const { error: itensError } = await supabase.from("venda_itens").insert(itens);
    if (itensError) return NextResponse.json({ error: itensError.message }, { status: 500 });
  }

  // substituir pagamentos
  const { error: delPagError } = await supabase.from("pagamentos").delete().eq("venda_id", id);
  if (delPagError) return NextResponse.json({ error: delPagError.message }, { status: 500 });

  if (Array.isArray(body.pagamentos) && body.pagamentos.length > 0) {
    const pagamentos = body.pagamentos.map((p: any) => ({
      venda_id: id,
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

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();

  // deletar itens e pagamentos explicitamente para garantir consistência
  const { error: delItensError } = await supabase.from("venda_itens").delete().eq("venda_id", id);
  if (delItensError) return NextResponse.json({ error: delItensError.message }, { status: 500 });

  const { error: delPagError } = await supabase.from("pagamentos").delete().eq("venda_id", id);
  if (delPagError) return NextResponse.json({ error: delPagError.message }, { status: 500 });

  const { error } = await supabase.from("vendas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
