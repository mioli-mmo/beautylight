import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Listagem de produtos — skeleton, sem busca de dados ainda.
// TODO:
//  - buscar produtos via Supabase (server component)
//  - busca/filtro por nome, marca, categoria
//  - tela/modal de criação e edição (CRUD)
//  - indicador visual de estoque baixo
export default function ProdutosPage() {
  return (
    <>
      <PageHeader title="Produtos" actionLabel="Novo produto" />

      <div className="p-4 md:p-8">
        <EmptyState message="Nenhum produto cadastrado ainda." />
      </div>
    </>
  );
}
