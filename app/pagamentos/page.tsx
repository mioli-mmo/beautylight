import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { PagamentoActions } from "@/components/pagamentos/PagamentoActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const dateStr =
    typeof value === "string" && value.length === 10 && !value.includes("T")
      ? `${value}T00:00:00`
      : value;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDateBR(value: string | null) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "sem data de vencimento";
}

function isWithinNext30Days(value: string | null) {
  if (!value) return false;
  const dueDate = parseDate(value);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureLimit = new Date(today);
  futureLimit.setDate(today.getDate() + 30);
  futureLimit.setHours(23, 59, 59, 999);
  return dueDate >= today && dueDate <= futureLimit;
}

function buildWhatsappLink(
  phone: string | null,
  payment: any,
  customValor?: number,
  customVencimento?: string | null
) {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  const valor = customValor ?? Number(payment.valor ?? 0);
  const vencimento = customVencimento !== undefined ? customVencimento : payment.data_vencimento;

  // Geração dinâmica dos emojis por CodePoint para ignorar limitações de encoding do arquivo
  const sparkle = String.fromCodePoint(0x2728);
  const money = String.fromCodePoint(0x1f4b0);
  const calendar = String.fromCodePoint(0x1f4c5);
  const lipstick = String.fromCodePoint(0x1f484);
  const nails = String.fromCodePoint(0x1f485);

  const message = `Olá, ${payment.cliente?.nome ?? "tudo bem"}! Tudo bem? ${sparkle}

Esta é uma mensagem automática da BL passando para lembrar do seu pagamento pendente:

${money} Valor: ${formatMoney(valor)}

${calendar} Vencimento: ${formatDateBR(vencimento)}

Qualquer dúvida ou se já tiver realizado o pagamento, é só nos avisar por aqui. Muito obrigada pelo carinho e preferência! ${lipstick}${nails}`;

  // Utiliza a API direta do WhatsApp para evitar quebras de codificação no redirecionamento do wa.me
  return `https://api.whatsapp.com/send?phone=55${digits}&text=${encodeURIComponent(message)}`;
}

function buildStatusHref(
  status: string,
  filters: { clienteId: string; inicio: string; fim: string }
) {
  const params = new URLSearchParams();
  if (status !== "todos") params.set("status", status);
  if (filters.clienteId && filters.clienteId !== "todos")
    params.set("cliente_id", filters.clienteId);
  if (filters.inicio) params.set("data_inicio", filters.inicio);
  if (filters.fim) params.set("data_fim", filters.fim);
  const query = params.toString();
  return query ? `/pagamentos?${query}` : "/pagamentos";
}

function getPaymentEffectivePendingInfo(p: any) {
  const numParcelas = Number(p.parcelas) || 1;
  const parcelasArray = Array.isArray(p.pagamento_parcelas) ? p.pagamento_parcelas : [];

  const pendingParcelas = parcelasArray
    .filter((par: any) => par.status === "pendente")
    .sort((a: any, b: any) => {
      const dateA = parseDate(a.data_vencimento)?.getTime() ?? Infinity;
      const dateB = parseDate(b.data_vencimento)?.getTime() ?? Infinity;
      if (dateA !== dateB) return dateA - dateB;
      return (a.numero_parcela ?? 0) - (b.numero_parcela ?? 0);
    });

  const parcelaPendente = pendingParcelas[0];

  const vencimento = parcelaPendente?.data_vencimento || p.data_vencimento;
  const valorParcela = parcelaPendente?.valor
    ? Number(parcelaPendente.valor)
    : Number(p.valor ?? 0) / numParcelas;

  return {
    numParcelas,
    parcelaPendente,
    vencimento,
    valorParcela,
  };
}

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams?:
    | { status?: string; cliente_id?: string; data_inicio?: string; data_fim?: string }
    | Promise<{ status?: string; cliente_id?: string; data_inicio?: string; data_fim?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const statusFilter = resolvedSearchParams?.status ?? "todos";
  const clienteFilter = resolvedSearchParams?.cliente_id ?? "todos";
  const dataInicio = resolvedSearchParams?.data_inicio ?? "";
  const dataFim = resolvedSearchParams?.data_fim ?? "";

  const { data: pagamentos, error: pagError } = await supabase
    .from("pagamentos")
    .select("*, pagamento_parcelas(*)")
    .order("data_vencimento", { ascending: true });

  const { data: vendas } = await supabase
    .from("vendas")
    .select("id, cliente_id, valor_total")
    .order("data_venda", { ascending: false });

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome, telefone")
    .order("nome");

  const vendasMap = new Map((vendas ?? []).map((v: any) => [v.id, v]));
  const clientesMap = new Map((clientes ?? []).map((c: any) => [c.id, c]));

  const normalizedPagamentos = (pagamentos ?? []).map((p: any) => {
    const venda = vendasMap.get(p.venda_id);
    const cliente = venda?.cliente_id ? clientesMap.get(venda.cliente_id) : null;
    return { ...p, venda, cliente };
  });

  const startDate = dataInicio ? parseDate(dataInicio) : null;
  const endDate = dataFim ? parseDate(dataFim) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

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

  const totalFiltrado = filteredPagamentos.reduce(
    (acc: number, p: any) => acc + Number(p.valor ?? 0),
    0
  );

  const pendentesNos30Dias = normalizedPagamentos.filter((p: any) => {
    const { vencimento, parcelaPendente } = getPaymentEffectivePendingInfo(p);

    if (p.status !== "pendente" && !parcelaPendente) return false;
    if (clienteFilter !== "todos" && p.cliente?.id !== clienteFilter) return false;
    if (!matchesDateRange(vencimento)) return false;
    return isWithinNext30Days(vencimento);
  });

  return (
    <>
      <PageHeader title="Pagamentos" actionLabel="Registrar pagamento" />

      <div className="p-4 md:p-8">
        <div className="mb-6 rounded border border-brand-200 bg-brand-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-medium text-brand-700">
              Pendentes nos próximos 30 dias
            </h3>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-brand-700">
              {pendentesNos30Dias.length} registros
            </span>
          </div>

          {pendentesNos30Dias.length === 0 ? (
            <p className="text-sm text-ink/60">
              Nenhum pagamento pendente com vencimento nos próximos 30 dias.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pendentesNos30Dias.map((p: any) => {
                const { numParcelas, vencimento, valorParcela } =
                  getPaymentEffectivePendingInfo(p);

                return (
                  <div key={p.id} className="rounded border bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">
                          {p.cliente?.nome ?? "Cliente sem vínculo"}
                        </div>
                        <div className="text-xs text-ink/60">
                          {formatForma(p.forma)}
                          {numParcelas > 1 ? ` (${numParcelas}x)` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-brand-700">
                          {formatMoney(valorParcela)}
                        </div>
                        {numParcelas > 1 && (
                          <div className="text-[10px] text-ink/60">
                            (valor da parcela)
                          </div>
                        )}
                        <div className="text-xs text-ink/60">
                          {vencimento ? formatDateBR(vencimento) : "Sem vencimento"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <a
                        href={buildWhatsappLink(
                          p.cliente?.telefone ?? null,
                          p,
                          valorParcela,
                          vencimento
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex rounded px-3 py-2 text-xs font-medium ${
                          p.cliente?.telefone
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "pointer-events-none bg-slate-200 text-slate-500"
                        }`}
                      >
                        {p.cliente?.telefone ? "Enviar lembrete" : "Telefone não cadastrado"}
                      </a>
                    </div>
                  </div>
                );
              })}
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
                  <select
                    name="cliente_id"
                    defaultValue={clienteFilter}
                    className="w-full rounded border px-2 py-2"
                  >
                    <option value="todos">Todos</option>
                    {(clientes ?? []).map((cliente: any) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-ink/80">
                  <span className="mb-1 block font-medium text-ink">Vencimento início</span>
                  <input
                    type="date"
                    name="data_inicio"
                    defaultValue={dataInicio}
                    className="rounded border px-2 py-2"
                  />
                </label>

                <label className="text-sm text-ink/80">
                  <span className="mb-1 block font-medium text-ink">Vencimento fim</span>
                  <input
                    type="date"
                    name="data_fim"
                    defaultValue={dataFim}
                    className="rounded border px-2 py-2"
                  />
                </label>

                <button
                  type="submit"
                  className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Filtrar
                </button>

                <Link
                  href={buildStatusHref(statusFilter, {
                    clienteId: "todos",
                    inicio: "",
                    fim: "",
                  })}
                  className="rounded border px-3 py-2 text-sm text-ink/70 hover:bg-slate-50"
                >
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
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    statusFilter === option.value
                      ? "bg-brand-600 text-white"
                      : "bg-white text-ink/70 ring-1 ring-brand-200"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between rounded border bg-white p-4 shadow-sm">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-ink/60">
                  Total exibido
                </span>
                <div className="text-2xl font-bold text-brand-700">
                  {formatMoney(totalFiltrado)}
                </div>
              </div>
              <div className="text-right text-sm text-ink/70">
                <span className="font-semibold text-ink">{filteredPagamentos.length}</span>{" "}
                {filteredPagamentos.length === 1 ? "registro" : "registros"}
              </div>
            </div>

            {pagError ? (
              <p className="text-sm text-red-600">
                Erro ao buscar pagamentos: {pagError.message}
              </p>
            ) : filteredPagamentos.length === 0 ? (
              <p className="p-6">Nenhum pagamento encontrado.</p>
            ) : (
              <div className="space-y-4">
                {filteredPagamentos.map((p: any) => (
                  <div key={p.id} className="rounded border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {p.cliente?.nome ?? "Cliente sem vínculo"} — {formatForma(p.forma)} —{" "}
                          {formatStatus(p.status)}
                        </div>
                        <div className="text-sm text-ink/60">
                          Pago: {formatDateBR(p.data_pagamento)}
                        </div>
                        <div className="text-sm text-ink/60">
                          Venc.: {formatDateBR(p.data_vencimento)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          R$ {Number(p.valor ?? 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-ink/60">
                          <a
                            href={
                              p.venda_id ? `/vendas/${p.venda_id}/detalhes` : "#"
                            }
                            className="text-brand-600 hover:underline"
                          >
                            Venda: {p.venda_id ?? "\u2014"}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-ink/60">
                        Parcelas: {p.parcelas ?? 1}
                      </div>
                      <div className="flex items-center gap-2">
                        {p.venda_id && (
                          <a
                            href={`/vendas/${p.venda_id}/detalhes`}
                            className="text-sm text-brand-600"
                          >
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