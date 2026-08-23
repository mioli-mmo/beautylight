import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientActions } from "@/components/clients/ClientActions";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes, error } = await supabase.from("clientes").select("*").order("nome");

  return (
    <>
      <PageHeader title="Clientes" />

      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-ink/80">Criar cliente</h2>
          {/* ClientForm é client component que faz POST/PUT para a API */}
          {/* eslint-disable-next-line @next/next/no-async-client-component */}
          <ClientForm />
        </div>

        <h2 className="mb-2 text-sm font-medium text-ink/80">Clientes cadastrados</h2>

        {error ? (
          <p className="text-sm text-red-600">Erro ao buscar clientes: {error.message}</p>
        ) : !clientes || clientes.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="overflow-auto rounded border bg-white">
            <table className="w-full table-fixed">
              <thead className="bg-brand-50 text-left text-sm text-ink/70">
                <tr>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Telefone</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c: any) => (
                  <tr key={c.id} className="border-t text-sm">
                    <td className="px-3 py-2">{c.nome}</td>
                    <td className="px-3 py-2">{c.telefone ?? "—"}</td>
                    <td className="px-3 py-2">{c.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      {/* ClientActions é client component com edit/delete */}
                      {/* @ts-ignore */}
                      <ClientActions client={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
