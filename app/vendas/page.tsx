import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Listagem de vendas — skeleton, sem busca de dados ainda.
// TODO:
//  - buscar vendas via Supabase, com cliente e status
//  - filtro por status (pendente/parcial/pago/cancelado) e período
//  - tela de nova venda: selecionar cliente + adicionar itens (produtos)
//  - tela de detalhe da venda, com itens e pagamentos vinculados
export default function VendasPage() {
  return (
    <>
      <PageHeader title="Vendas" actionLabel="Nova venda" />

      <div className="p-4 md:p-8">
        <EmptyState message="Nenhuma venda registrada ainda." />
      </div>
    </>
  );
}
