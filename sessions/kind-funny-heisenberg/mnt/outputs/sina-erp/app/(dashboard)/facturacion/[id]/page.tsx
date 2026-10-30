import { notFound } from 'next/navigation';
import { requirePermission, can } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { loadFacturaConPagos } from '@/lib/cobranza/load-factura';
import { FacturaDetalle } from '@/components/cobranza/factura-detalle';

export const dynamic = 'force-dynamic';

export default async function FacturaPage({ params }: { params: { id: string } }) {
  const profile = await requirePermission('facturacion.ver');
  const factura = await loadFacturaConPagos(params.id);
  if (!factura) notFound();

  return (
    <>
      <TopBar title={`Factura ${factura.folio ?? ''}`} subtitle="Detalle" />
      <FacturaDetalle
        factura={factura}
        canAnular={can(profile, 'cobranza.registrar_pago')}
        backHref="/facturacion"
        backLabel="← Facturación"
      />
    </>
  );
}
