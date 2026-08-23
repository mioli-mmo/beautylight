import { PageHeader } from "@/components/ui/PageHeader";
import { ParcelasList } from "@/components/boletos/ParcelasList";

export default async function BoletosParcelasPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <>
      <PageHeader title="Parcelas do boleto" />
      <div className="p-4 md:p-8">
        <div className="rounded border p-4">
          {/* ParcelasList is a client component that fetches parcelas and allows actions */}
          {/* @ts-expect-error Server component importing client component */}
          <ParcelasList boletoId={id} />
        </div>
      </div>
    </>
  );
}
