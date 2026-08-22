import { PageHeader } from "@/components/ui/PageHeader";

// Dashboard inicial — skeleton.
// TODO: trazer indicadores reais (vendas do mês, a receber, estoque baixo...)
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Início" />

      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 md:gap-4 md:p-8">
        <DashboardCard label="Vendas do mês" value="—" />
        <DashboardCard label="A receber" value="—" />
        <DashboardCard label="Clientes ativos" value="—" />
        <DashboardCard label="Estoque baixo" value="—" />
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
