import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [vendasRes, pagamentosRes, boletosRes] = await Promise.all([
    supabase.from("vendas").select("id, valor_total, data_venda"),
    supabase.from("pagamentos").select("id, valor, status, data_pagamento, data_vencimento"),
    supabase.from("boletos").select("id, valor_total, valor_pago, status"),
  ]);

  const vendas = vendasRes.data ?? [];
  const pagamentos = pagamentosRes.data ?? [];
  const boletos = boletosRes.data ?? [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const vendasDoMes = vendas.filter((v: any) => {
    const date = new Date(v.data_venda);
    return !Number.isNaN(date.getTime()) && date >= startOfMonth;
  });

  const totalVendasMes = vendasDoMes.reduce((sum: number, v: any) => sum + Number(v.valor_total ?? 0), 0);
  const totalReceber = (pagamentos as any[])
    .filter((p: any) => String(p.status ?? "") === "pendente")
    .reduce((sum: number, p: any) => sum + Number(p.valor ?? 0), 0);

  const totalRecebidoMes = (pagamentos as any[])
    .filter((p: any) => {
      if (String(p.status ?? "") !== "pago" || !p.data_pagamento) return false;
      const date = new Date(p.data_pagamento);
      return !Number.isNaN(date.getTime()) && date >= startOfMonth;
    })
    .reduce((sum: number, p: any) => sum + Number(p.valor ?? 0), 0);

  const boletosAbertos = (boletos as any[])
    .filter((b: any) => String(b.status ?? "") !== "pago")
    .reduce((sum: number, b: any) => sum + (Number(b.valor_total ?? 0) - Number(b.valor_pago ?? 0)), 0);

  const receberNos30Dias = (pagamentos as any[])
    .filter((p: any) => {
      if (String(p.status ?? "") !== "pendente" || !p.data_vencimento) return false;
      const dueDate = new Date(p.data_vencimento);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 30);
      return dueDate >= new Date() && dueDate <= limitDate;
    })
    .reduce((sum: number, p: any) => sum + Number(p.valor ?? 0), 0);

  return (
    <>
      <PageHeader title="Início" />

      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 md:gap-4 md:p-8">
        <DashboardCard label="Vendas do mês" value={money(totalVendasMes)} />
        <DashboardCard label="A receber" value={money(totalReceber)} />
        <DashboardCard label="Recebido no mês" value={money(totalRecebidoMes)} />
        <DashboardCard label="Boletos em aberto" value={money(boletosAbertos)} />
      </div>

      <div className="px-4 pb-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <OverviewPanel title="Resumo financeiro" items={[
            { label: "Vencimentos nos próximos 30 dias", value: money(receberNos30Dias) },
            { label: "Total de pagamentos pendentes", value: money(totalReceber) },
            { label: "Receita do mês", value: money(totalVendasMes) },
          ]} />

          <OverviewPanel title="Fluxo de caixa" items={[
            { label: "Pagamentos efetivados", value: money(totalRecebidoMes) },
            { label: "Dívidas em aberto", value: money(boletosAbertos + totalReceber) },
            { label: "Saldo bruto estimado", value: money(totalVendasMes - totalRecebidoMes - boletosAbertos) },
          ]} />
        </div>
      </div>
    </>
  );
}

function DashboardCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-200 bg-white p-4">
      <p className="text-xs text-ink/60">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-700">
        {value}
      </p>
    </div>
  );
}

function OverviewPanel({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-lg border border-brand-200 bg-white p-4">
      <h3 className="mb-3 text-base font-medium text-brand-700">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 border-b border-brand-100 pb-2 last:border-none last:pb-0">
            <span className="text-sm text-ink/70">{item.label}</span>
            <span className="font-medium text-ink">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
