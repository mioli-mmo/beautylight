import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function formatDateForInsert(value: any) {
  if (!value) return null;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T12:00:00`).toISOString();
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function addMonths(dateValue: string | null, months: number) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

function buildParcelas(valorTotal: number, parcelas: number, dataBase: string | null) {
  const total = Number(valorTotal) || 0;
  const count = Math.max(1, Number(parcelas) || 1);
  if (total <= 0) return [];
  const valorPorParcela = total / count;

  return Array.from({ length: count }, (_, index) => ({
    numero: index + 1,
    valor: index === count - 1 ? Number((total - valorPorParcela * (count - 1)).toFixed(2)) : Number(valorPorParcela.toFixed(2)),
    data_vencimento: dataBase ? addMonths(formatDateForInsert(dataBase), index) : null,
    status: "pendente",
    data_pagamento: null,
  }));
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("pagamentos").select("*, pagamento_parcelas(*)").eq("id", id).maybeSingle();

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

  const parcelasDetalhes = Array.isArray(body.parcelas_detalhes) && body.parcelas_detalhes.length > 0
    ? body.parcelas_detalhes
    : buildParcelas(body.valor ?? 0, body.parcelas ?? 1, body.data_vencimento ?? data?.data_vencimento ?? null);

  if (parcelasDetalhes.length > 0) {
    const { error: deleteError } = await supabase.from("pagamento_parcelas").delete().eq("pagamento_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    const { error: parcelasError } = await supabase.from("pagamento_parcelas").insert(
      parcelasDetalhes.map((parcela: any, index: number) => ({
        pagamento_id: id,
        numero: Number(parcela.numero ?? index + 1),
        valor: Number(parcela.valor ?? 0),
        data_vencimento: parcela.data_vencimento ?? null,
        data_pagamento: parcela.data_pagamento ?? null,
        status: parcela.status ?? "pendente",
      }))
    );

    if (parcelasError) return NextResponse.json({ error: parcelasError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { error: parcelasError } = await supabase.from("pagamento_parcelas").delete().eq("pagamento_id", id);
  if (parcelasError) return NextResponse.json({ error: parcelasError.message }, { status: 500 });

  const { error } = await supabase.from("pagamentos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
