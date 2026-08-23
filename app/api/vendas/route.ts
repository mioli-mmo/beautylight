import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(dateValue: string | null, months: number) {
  if (!dateValue) return null;
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

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendas")
    .select("*, clientes(id,nome), venda_itens(*), pagamentos(*)")
    .order("data_venda", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payloadVenda = {
    cliente_id: body.cliente_id ?? null,
    data_venda: body.data_venda ?? new Date().toISOString(),
    status: body.status ?? "pendente",
    valor_total: body.valor_total ?? 0,
    desconto: body.desconto ?? 0,
    observacoes: body.observacoes ?? null,
  };

  const supabase = await createClient();

  // 1. Cria o registro da venda
  const { data: venda, error: vendaError } = await supabase
    .from("vendas")
    .insert([payloadVenda])
    .select()
    .single();

  if (vendaError || !venda) {
    return NextResponse.json(
      { error: vendaError?.message ?? "Falha ao criar venda." },
      { status: 500 }
    );
  }

  const vendaId = venda.id;

  // 2. Insere os itens da venda
  if (Array.isArray(body.venda_itens) && body.venda_itens.length > 0) {
    const itens = body.venda_itens.map((it: any) => ({
      venda_id: vendaId,
      produto_id: it.produto_id ?? null,
      produto_nome: it.produto_nome,
      quantidade: it.quantidade ?? 0,
      preco_unitario: it.preco_unitario ?? 0,
    }));

    const { error: itensError } = await supabase.from("venda_itens").insert(itens);
    if (itensError) return NextResponse.json({ error: itensError.message }, { status: 500 });
  }

  // 3. Normaliza os dados de pagamento independente do formato enviado pelo formulário
  const primeiroPagamento = Array.isArray(body.pagamentos) && body.pagamentos.length > 0 ? body.pagamentos[0] : {};

  const forma =
    body.forma_pagamento ??
    body.forma ??
    primeiroPagamento.forma ??
    "dinheiro";

  const qtdParcelas = Math.max(
    1,
    Number(body.parcelas ?? body.qtd_parcelas ?? primeiroPagamento.parcelas ?? 1)
  );

  const valorTotal = Number(body.valor_total ?? primeiroPagamento.valor ?? 0);
  const dataVencimento = body.data_vencimento ?? primeiroPagamento.data_vencimento ?? null;

  // Prioriza o status enviado explicitamente no body/pagamentos
  let statusPagamento =
    body.status_pagamento ??
    primeiroPagamento.status ??
    (body.status === "pago" || body.status === "pendente" ? body.status : null);

  if (!statusPagamento) {
    const isAVista = ["dinheiro", "pix", "debito", "credito_vista"].includes(forma);
    statusPagamento = isAVista ? "pago" : "pendente";
  }

  // 4. Cria 1 registro pai na tabela 'pagamentos'
  const payloadPagamento = {
    venda_id: vendaId,
    forma,
    status: statusPagamento,
    valor: valorTotal,
    parcelas: qtdParcelas,
    data_pagamento: statusPagamento === "pago" ? new Date().toISOString() : null,
    data_vencimento: dataVencimento,
    observacoes: body.observacoes ?? null,
  };

  const { data: pagamentoCriado, error: pagError } = await supabase
    .from("pagamentos")
    .insert([payloadPagamento])
    .select()
    .single();

  if (pagError) return NextResponse.json({ error: pagError.message }, { status: 500 });

  // 5. Cria as parcelas individuais na tabela 'pagamento_parcelas' se for fiado ou parcelado
  if (qtdParcelas > 1 || ["fiado", "credito_parcelado"].includes(forma)) {
    const valorBase = Math.floor((valorTotal / qtdParcelas) * 100) / 100;
    const resto = Number((valorTotal - valorBase * qtdParcelas).toFixed(2));

    const parcelas = Array.from({ length: qtdParcelas }, (_, index) => ({
      pagamento_id: pagamentoCriado.id,
      numero: index + 1,
      valor: index === qtdParcelas - 1 ? Number((valorBase + resto).toFixed(2)) : valorBase,
      data_vencimento: addMonths(dataVencimento, index),
      status: statusPagamento === "pago" ? "pago" : "pendente",
      data_pagamento: statusPagamento === "pago" ? formatDateToYYYYMMDD(new Date()) : null,
    }));

    const { error: parcelasError } = await supabase
      .from("pagamento_parcelas")
      .insert(parcelas);

    if (parcelasError) {
      return NextResponse.json({ error: parcelasError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, venda_id: vendaId }, { status: 201 });
}