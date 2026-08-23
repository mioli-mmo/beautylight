import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TIPOS_PERMITIDOS = new Set(["ajuste_manual", "entrada"]);

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("estoque_movimentos").select("*").order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.produto_id) {
    return NextResponse.json({ error: "Produto obrigatório." }, { status: 400 });
  }

  const tipo = typeof body.tipo === "string" ? body.tipo : "";
  if (!TIPOS_PERMITIDOS.has(tipo)) {
    return NextResponse.json({ error: "Tipo de ajuste inválido." }, { status: 400 });
  }

  const quantidade = Number(body.quantidade);
  if (!Number.isFinite(quantidade) || quantidade === 0) {
    return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
  }

  const payload = {
    produto_id: body.produto_id,
    tipo,
    quantidade,
    observacao: body.observacao ?? null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.from("estoque_movimentos").insert([payload]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
