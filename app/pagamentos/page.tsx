import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { PagamentoActions } from "@/components/pagamentos/PagamentoActions";

const formaLabels: Record<string, string> = {
  credito_vista: "Crédito à vista",
  credito_parcelado: "Crédito parcelado",
  debito: "Débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
  fiado: "Fiado",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

function formatForma(f: any) {
  if (!f) return "-";
  return formaLabels[String(f)] ?? String(f).replace(/_/g, " ");
}

function formatStatus(s: any) {
  if (!s) return "-";
  return statusLabels[String(s)] ?? String(s);
}

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinNext30Days(value: string | null) {
  if (!value) return false;
  const dueDate = parseDate(value);
  if (!dueDate) return false;
  const today = new Date();
  const futureLimit = new Date();
  futureLimit.setDate(today.getDate() + 30);
  return dueDate >= today && dueDate <= futureLimit;
}

function buildWhatsappLink(phone: string | null, payment: any) {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  const message = `Olá!%20Sou%20o%20responsável%20pela%20empresa%20e%20venho%20lembrar%20o%20pagamento%20pendente%20de%20R$%20${Number(payment.valor ?? 0).toFixed(2)}%20com%20vencimento%20em%20${parseDate(payment.data_vencimento)?.toLocaleDateString("pt-BR") ?? "breve"}.%20Agradecemos%20a%20preferência%20e%20ficamos%20à%20disposição.`;
  return `https://wa.me/55${digits}?text=${message}`;
}

function buildStatusHref(status: string, filters: { clienteId: string; inicio: string; fim: string }) {
  const params = new URLSearchParams();
  if (status !== "todos") params.set("status", status);
  if (filters.clienteId && filters.clienteId !== "todos") params.set("cliente_id", filters.clienteId);
  if (filters.inicio) params.set("data_inicio", filters.inicio);
  if (filters.fim) params.set("data_fim", filters.fim);
  const query = params.toString();
  return query ? `/pagamentos?${query}` : "/pagamentos";
}

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams?: { status?: string; cliente_id?: string; data_inicio?: string; data_fim?: string };
}) {
  const supabase = await createClient();
  const statusFilter = searchParams?.status ?? "todos";
  const clienteFilter = searchParams?.cliente_id ?? "todos";
  const dataInicio = searchParams?.data_inicio ?? "";
  const dataFim = searchParams?.data_fim ?? "";

  const { data: pagamentos, error: pagError } = await supabase.from("pagamentos").select("*").order("data_vencimento", { ascending: true });
  const { data: vendas } = await supabase.from("vendas").select("id, cliente_id, valor_total").order("data_venda", { ascending: false });
  const { data: clientes } = await supabase.from("clientes").select("id, nome, telefone").order("nome");

  const vendasMap = new Map((vendas ?? []).map((v: any) => [v.id, v]));
  const clientesMap = new Map((clientes ?? []).map((c: any) => [c.id, c]));

  const normalizedPagamentos = (pagamentos ?? []).map((p: any) => {
    const venda = vendasMap.get(p.venda_id);
    const cliente = venda?.cliente_id ? clientesMap.get(venda.cliente_id) : null;
    return { ...p, venda, cliente };
  });

  const startDate = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null;
  const endDate = dataFim ? new Date(`${dataFim}T23:59:59`) : null;

  const matchesDateRange = (value: string | null) => {
    if (!value) return true;
    const dueDate = parseDate(value);
    if (!dueDate) return true;
    if (startDate && dueDate < startDate) return false;
    if (endDate && dueDate > endDate) return false;
    return true;
  };

  const filteredPagamentos = normalizedPagamentos.filter((p: any) => {
    if (statusFilter !== "todos" && String(p.status) !== statusFilter) return false;
    if (clienteFilter !== "todos" && p.cliente?.id !== clienteFilter) return false;
    return matchesDateRange(p.data_vencimento);
  });

  const pendentesNos30Dias = normalizedPagamentos.filter((p: any) => {
    if (p.status !== "pendente") return false;
    if (clienteFilter !== "todos" && p.cliente?.id !== clienteFilter) return false;
    if (!matchesDateRange(p.data_vencimento)) return false;
    return isWithinNext30Days(p.data_vencimento);
  });

  return (
    <>
      <PageHeader title="Pagamentos" actionLabel="Registrar pagamento" />

      <div className="p-4 md:p-8">
        <div className="mb-6 rounded border border-brand-200 bg-brand-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-medium text-brand-700">Pendentes nos próximos 30 dias</h3>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-brand-700">
              {pendentesNos30Dias.length} registros
            </span>
          </div>

          {pendentesNos30Dias.length === 0 ? (
            <p className="text-sm text-ink/60">Nenhum pagamento pendente com vencimento nos próximos 30 dias.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pendentesNos30Dias.map((p: any) => (
                <div key={p.id} className="rounded border bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{p.cliente?.nome ?? "Cliente sem vínculo"}</div>
                      <div className="text-xs text-ink/60">{formatForma(p.forma)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">R$ {Number(p.valor ?? 0).toFixed(2)}</div>
                      <div className="text-xs text-ink/60">{p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString("pt-BR") : "Sem vencimento"}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <a
                      href={buildWhatsappLink(p.cliente?.telefone ?? null, p)}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex rounded px-3 py-2 text-xs font-medium ${p.cliente?.telefone ? "bg-green-600 text-white hover:bg-green-700" : "pointer-events-none bg-slate-200 text-slate-500"}`}
                    >
                      {p.cliente?.telefone ? "Enviar lembrete" : "Telefone não cadastrado"}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <form method="get" action="/pagamentos" className="mb-4 rounded border bg-white p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <input type="hidden" name="status" value={statusFilter} />
                <label className="flex-1 text-sm text-ink/80">
                  <span className="mb-1 block font-medium text-ink">Cliente</span>
                  <select name="cliente_id" defaultValue={clienteFilter} className="w-full rounded border px-2 py-2">
                    <option value="todos">Todos</option>
                    {(clientes ?? []).map((cliente: any) => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-ink/80">
                  <span className="mb-1 block font-medium text-ink">Vencimento início</span>
                  <input type="date" name="data_inicio" defaultValue={dataInicio} className="rounded border px-2 py-2" />
                </label>

                <label className="text-sm text-ink/80">
                  <span className="mb-1 block font-medium text-ink">Vencimento fim</span>
                  <input type="date" name="data_fim" defaultValue={dataFim} className="rounded border px-2 py-2" />
                </label>

                <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Filtrar
                </button>

                <Link href={buildStatusHref(statusFilter, { clienteId: "todos", inicio: "", fim: "" })} className="rounded border px-3 py-2 text-sm text-ink/70 hover:bg-slate-50">
                  Limpar
                </Link>
              </div>
            </form>

            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { value: "todos", label: "Todos" },
                { value: "pendente", label: "Pendentes" },
                { value: "pago", label: "Pagos" },
                { value: "cancelado", label: "Cancelados" },
              ].map((option) => (
                <Link
                  key={option.value}
                  href={buildStatusHref(option.value, {
                    clienteId: clienteFilter,
                    inicio: dataInicio,
                    fim: dataFim,
                  })}
                  className={`rounded-full px-3 py-1.5 text-sm ${statusFilter === option.value ? "bg-brand-600 text-white" : "bg-white text-ink/70 ring-1 ring-brand-200"}`}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            {pagError ? (
              <p className="text-sm text-red-600">Erro ao buscar pagamentos: {pagError.message}</p>
            ) : filteredPagamentos.length === 0 ? (
              <p className="p-6">Nenhum pagamento encontrado.</p>
            ) : (
              <div className="space-y-4">
                {filteredPagamentos.map((p: any) => (
                  <div key={p.id} className="rounded border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{p.cliente?.nome ?? "Cliente sem vínculo"} — {formatForma(p.forma)} — {formatStatus(p.status)}</div>
                        <div className="text-sm text-ink/60">Pago: {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString("pt-BR") : "-"}</div>
                        <div className="text-sm text-ink/60">Venc.: {p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString("pt-BR") : "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {Number(p.valor ?? 0).toFixed(2)}</div>
                        <div className="text-sm text-ink/60">
                          <a href={p.venda_id ? `/vendas/${p.venda_id}/detalhes` : "#"} className="text-brand-600 hover:underline">
                            Venda: {p.venda_id ?? "—"}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-ink/60">Parcelas: {p.parcelas ?? 1}</div>
                      <div className="flex items-center gap-2">
                        {p.venda_id && (
                          <a href={`/vendas/${p.venda_id}/detalhes`} className="text-sm text-brand-600">
                            Ver venda
                          </a>
                        )}
                        <PagamentoActions id={p.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="rounded border p-4">
              <h3 className="mb-4 text-lg font-medium">Registrar pagamento</h3>
              <PagamentoForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
