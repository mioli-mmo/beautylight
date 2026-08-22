import { createClient } from "@/lib/supabase/server";
import { VendaForm } from "@/components/vendas/VendaForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function VendaEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendas")
    .select("*, clientes(id,nome), venda_itens(*), pagamentos(*)")
    .eq("id", id)
    .maybeSingle();

  return (
    <>
      <PageHeader title="Editar venda" />
      <div className="p-4 md:p-8">
        <div className="rounded border p-4">
          {/* @ts-expect-error Server -> Client */}
          <VendaForm venda={data} />
        </div>
      </div>
    </>
  );
}
