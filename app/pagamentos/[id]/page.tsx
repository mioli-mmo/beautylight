import { createClient } from "@/lib/supabase/server";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function PagamentoEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data } = await supabase.from("pagamentos").select("*").eq("id", id).maybeSingle();

  return (
    <>
      <PageHeader title="Editar pagamento" />
      <div className="p-4 md:p-8">
        <div className="rounded border p-4">
          <PagamentoForm pagamento={data} />
        </div>
      </div>
    </>
  );
}
