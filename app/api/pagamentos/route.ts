import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pagamentos").select("*").order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payload = {
    venda_id: body.venda_id ?? null,
    forma: body.forma,
    status: body.status ?? "pendente",
    valor: body.valor ?? 0,
    parcelas: body.parcelas ?? 1,
    data_pagamento: body.data_pagamento ?? null,
    data_vencimento: body.data_vencimento ?? null,
    observacoes: body.observacoes ?? null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.from("pagamentos").insert([payload]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
