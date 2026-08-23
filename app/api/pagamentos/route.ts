import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Formata para YYYY-MM-DD garantindo compatibilidade com o banco
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(dateValue: string | null, months: number) {
  if (!dateValue) return null;
  
  // Se for YYYY-MM-DD, divide manualmente para evitar distorção de fuso
  const parts = dateValue.split("T")[0].split("-").map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    const [year, month, day] = parts;
    const d = new Date(year, month - 1 + months, day);
    return formatDateToYYYYMMDD(d);
  }

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return formatDateToYYYYMMDD(d);
}

function buildParcelas(
  valorTotal: number,
  parcelas: number,
  dataBase: string | null,
  statusGeral: string
) {
  const total = Number(valorTotal) || 0;
  const count = Math.max(1, Number(parcelas) || 1);
  if (total <= 0) return [];

  const valorPorParcela = Math.floor((total / count) * 100) / 100;
  const resto = Number((total - valorPorParcela * count).toFixed(2));

  return Array.from({ length: count }, (_, index) => ({
    numero: index + 1,
    valor: index === count - 1 ? Number((valorPorParcela + resto).toFixed(2)) : valorPorParcela,
    data_vencimento: addMonths(dataBase, index),
    status: statusGeral === "pago" ? "pago" : "pendente",
    data_pagamento: statusGeral === "pago" ? formatDateToYYYYMMDD(new Date()) : null,
  }));
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .select("*, pagamento_parcelas(*)")
    .order("created_at", { ascending: false });

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
  
  // 1. Insere o pagamento pai
  const { data, error } = await supabase
    .from("pagamentos")
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Insere as parcelas na tabela pagamento_parcelas
  const parcelas = buildParcelas(
    payload.valor ?? 0,
    payload.parcelas ?? 1,
    payload.data_vencimento ?? null,
    payload.status
  );

  if (parcelas.length > 0) {
    const { error: parcelasError } = await supabase.from("pagamento_parcelas").insert(
      parcelas.map((parcela) => ({
        pagamento_id: data.id,
        ...parcela,
      }))
    );

    if (parcelasError) {
      return NextResponse.json({ error: parcelasError.message }, { status: 500 });
    }
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID do pagamento não informado." }, { status: 400 });
  }

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

  // 1. Atualiza o pagamento pai
  const { data, error } = await supabase
    .from("pagamentos")
    .update(payload)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Remove parcelas antigas pendentes para evitar duplicidade
  await supabase
    .from("pagamento_parcelas")
    .delete()
    .eq("pagamento_id", body.id)
    .eq("status", "pendente");

  // 3. Recria as parcelas atualizadas na tabela pagamento_parcelas
  const parcelas = buildParcelas(
    payload.valor ?? 0,
    payload.parcelas ?? 1,
    payload.data_vencimento ?? null,
    payload.status
  );

  if (parcelas.length > 0) {
    const { error: parcelasError } = await supabase.from("pagamento_parcelas").insert(
      parcelas.map((parcela) => ({
        pagamento_id: body.id,
        ...parcela,
      }))
    );

    if (parcelasError) {
      return NextResponse.json({ error: parcelasError.message }, { status: 500 });
    }
  }

  return NextResponse.json(data);
}