import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("pagamento_parcelas").select("*").eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const supabase = await createClient();

  const { data: parcela, error } = await supabase
    .from("pagamento_parcelas")
    .update({
      valor: body.valor ?? undefined,
      data_vencimento: body.data_vencimento ?? undefined,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parcela?.pagamento_id) {
    const { data: parcelas, error: sumError } = await supabase
      .from("pagamento_parcelas")
      .select("valor")
      .eq("pagamento_id", parcela.pagamento_id);

    if (sumError) return NextResponse.json({ error: sumError.message }, { status: 500 });

    const total = (parcelas ?? []).reduce((sum: number, item: any) => sum + Number(item.valor ?? 0), 0);
    const { error: pagamentoError } = await supabase
      .from("pagamentos")
      .update({ valor: total })
      .eq("id", parcela.pagamento_id);

    if (pagamentoError) return NextResponse.json({ error: pagamentoError.message }, { status: 500 });
  }

  return NextResponse.json(parcela);
}
