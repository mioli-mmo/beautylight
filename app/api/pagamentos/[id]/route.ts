import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("pagamentos").select("*").eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pagamentos")
    .update({
      venda_id: body.venda_id ?? null,
      forma: body.forma,
      status: body.status ?? "pendente",
      valor: body.valor ?? 0,
      parcelas: body.parcelas ?? 1,
      data_pagamento: body.data_pagamento ?? null,
      data_vencimento: body.data_vencimento ?? null,
      observacoes: body.observacoes ?? null,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { error } = await supabase.from("pagamentos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
