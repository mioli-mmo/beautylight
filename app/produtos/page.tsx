import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductActions } from "@/components/products/ProductActions";

export default async function ProdutosPage() {
  const supabase = await createClient();
  const { data: produtos, error } = await supabase.from("produtos").select("*").order("nome");

  return (
    <>
      <PageHeader title="Produtos" />

      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-ink/80">Criar produto</h2>
          {/* ProductForm é client component que faz POST/PUT para a API */}
          {/* eslint-disable-next-line @next/next/no-async-client-component */}
          <ProductForm />
        </div>

        <h2 className="mb-2 text-sm font-medium text-ink/80">Produtos cadastrados</h2>

        {error ? (
          <p className="text-sm text-red-600">Erro ao buscar produtos: {error.message}</p>
        ) : !produtos || produtos.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum produto cadastrado ainda.</p>
        ) : (
          <div className="overflow-auto rounded border bg-white">
            <table className="w-full table-fixed">
              <thead className="bg-brand-50 text-left text-sm text-ink/70">
                <tr>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Preço</th>
                  <th className="px-3 py-2">Estoque</th>
                  <th className="px-3 py-2">Ativo</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p: any) => (
                  <tr key={p.id} className="border-t text-sm">
                    <td className="px-3 py-2">{p.nome}</td>
                    <td className="px-3 py-2">R$ {p.preco_venda?.toFixed?.(2) ?? "0.00"}</td>
                    <td className="px-3 py-2">{p.estoque_atual}</td>
                    <td className="px-3 py-2">{p.ativo ? "Sim" : "Não"}</td>
                    <td className="px-3 py-2">
                      {/* ProductActions é client component com edit/delete */}
                      {/* @ts-ignore */}
                      <ProductActions product={p} />
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
