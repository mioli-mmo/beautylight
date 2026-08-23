import { createClient } from "@/lib/supabase/server";
import { BoletoForm } from "@/components/boletos/BoletoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function BoletoEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data } = await supabase.from("boletos").select("*, boleto_itens(*)").eq("id", id).maybeSingle();

  return (
    <>
      <PageHeader title="Editar boleto" />
      <div className="p-4 md:p-8">
        <div className="rounded border p-4">
          <BoletoForm boleto={data} />
        </div>
      </div>
    </>
  );
}
