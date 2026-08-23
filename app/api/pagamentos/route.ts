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

  const parcelas = buildParcelas(payload.valor ?? 0, payload.parcelas ?? 1, payload.data_vencimento ?? null);
  if (parcelas.length > 0) {
    const { error: parcelasError } = await supabase.from("pagamento_parcelas").insert(
      parcelas.map((parcela) => ({
        pagamento_id: data.id,
        ...parcela,
      }))
    );

    if (parcelasError) return NextResponse.json({ error: parcelasError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
