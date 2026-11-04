import { notFound } from 'next/navigation';
import { requirePermission, can } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { loadFacturaConPagos } from '@/lib/cobranza/load-factura';
import { FacturaDetalle } from '@/components/cobranza/factura-detalle';

export const dynamic = 'force-dynamic';

export default async function CobranzaFacturaPage({ params }: { params: { id: string } }) {
  const profile = await requirePermission('cobranza.ver');
  const factura = await loadFacturaConPagos(params.id);
  if (!factura) notFound();

  return (
    <>
      <TopBar title={`Factura ${factura.folio ?? ''}`} subtitle="Detalle de cobranza" />
      <FacturaDetalle
        factura={factura}
        canAnular={can(profile, 'cobranza.registrar_pago')}
        backHref="/cobranza"
        backLabel="← Cobranza"
      />
    </>
  );
}
