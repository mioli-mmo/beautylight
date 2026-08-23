import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").select("*").order("nome");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payload = {
    nome: body.nome,
    telefone: body.telefone ?? null,
    email: body.email ?? null,
    endereco: body.endereco ?? null,
    observacoes: body.observacoes ?? null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").insert([payload]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
