import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Listagem de pagamentos — skeleton, sem busca de dados ainda.
// TODO:
//  - buscar pagamentos via Supabase, com venda/cliente vinculados
//  - filtro por forma de pagamento e status (pendente/pago/cancelado)
//  - destaque para fiado vencido / a vencer
//  - tela de registro de pagamento (vinculado a uma venda)
export default function PagamentosPage() {
  return (
    <>
      <PageHeader title="Pagamentos" actionLabel="Registrar pagamento" />

      <div className="p-4 md:p-8">
        <EmptyState message="Nenhum pagamento registrado ainda." />
      </div>
    </>
  );
}
