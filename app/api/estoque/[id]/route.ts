import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TIPOS_PERMITIDOS = new Set(["ajuste_manual", "entrada"]);

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("estoque_movimentos").select("*").eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estoque_movimentos")
    .update({
      produto_id: body.produto_id,
      tipo,
      quantidade,
      observacao: body.observacao ?? null,
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
  const { error } = await supabase.from("estoque_movimentos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
