import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("produtos").select("*").order("nome");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payload = {
    nome: body.nome,
    marca: body.marca ?? "outro",
    categoria_id: body.categoria_id ?? null,
    codigo_referencia: body.codigo_referencia ?? null,
    descricao: body.descricao ?? null,
    preco_custo: body.preco_custo ?? 0,
    preco_venda: body.preco_venda ?? 0,
    estoque_atual: body.estoque_atual ?? 0,
    estoque_minimo: body.estoque_minimo ?? 0,
    imagem_url: body.imagem_url ?? null,
    ativo: body.ativo ?? true,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.from("produtos").insert([payload]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
