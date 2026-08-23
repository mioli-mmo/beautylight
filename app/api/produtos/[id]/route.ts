import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("produtos").select("*").eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos")
    .update({
      nome: body.nome,
      marca: body.marca,
      categoria_id: body.categoria_id ?? null,
      codigo_referencia: body.codigo_referencia ?? null,
      descricao: body.descricao ?? null,
      preco_custo: body.preco_custo ?? 0,
      preco_venda: body.preco_venda ?? 0,
      estoque_atual: body.estoque_atual ?? 0,
      estoque_minimo: body.estoque_minimo ?? 0,
      imagem_url: body.imagem_url ?? null,
      ativo: body.ativo ?? true,
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
  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
