import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Listagem de clientes — skeleton, sem busca de dados ainda.
// TODO:
//  - buscar clientes via Supabase (server component)
//  - busca por nome/telefone
//  - tela/modal de criação e edição (CRUD)
//  - exibir saldo em aberto (fiado) por cliente
export default function ClientesPage() {
  return (
    <>
      <PageHeader title="Clientes" actionLabel="Novo cliente" />

      <div className="p-4 md:p-8">
        <EmptyState message="Nenhum cliente cadastrado ainda." />
      </div>
    </>
  );
}
