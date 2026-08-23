import { createClient } from "@/lib/supabase/server";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagamentoParcelasEditor } from "@/components/pagamentos/PagamentoParcelasEditor";

export default async function PagamentoEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data } = await supabase.from("pagamentos").select("*, pagamento_parcelas(*)").eq("id", id).maybeSingle();

  return (
    <>
      <PageHeader title="Editar pagamento" />
      <div className="p-4 md:p-8">
        <div className="space-y-4">
          <div className="rounded border p-4">
            <PagamentoForm pagamento={data} />
          </div>

          {data && Array.isArray((data as any).pagamento_parcelas) && (data as any).pagamento_parcelas.length > 0 && (
            <div className="rounded border p-4">
              <PagamentoParcelasEditor pagamento={data as any} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
