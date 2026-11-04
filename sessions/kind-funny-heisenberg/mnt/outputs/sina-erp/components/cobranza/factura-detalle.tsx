import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Kpi } from '@/components/ui/kpi';
import { CLP, fmtDate, formatRut } from '@/lib/format';
import { etiquetaEstadoPago, pagoRechazado, tonoEstadoPago } from '@/lib/cobranza/anular-pago';
import type { FacturaConPagos } from '@/lib/cobranza/load-factura';
import { PagosFactura } from '@/components/cobranza/pagos-factura';

export function FacturaDetalle({
  factura,
  canAnular,
  backHref,
  backLabel,
}: {
  factura: FacturaConPagos;
  canAnular: boolean;
  backHref: string;
  backLabel: string;
}) {
  const pagado = factura.pagos
    .filter(p => !pagoRechazado(p))
    .reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const saldo = Math.max(0, Number(factura.total) - pagado);

  return (
    <div className="p-8 space-y-6">
      <div className="text-sm">
        <Link href={backHref} className="text-sina-navy font-medium">{backLabel}</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi label="Total" value={CLP(Number(factura.total))} />
        <Kpi label="Pagado" value={CLP(pagado)} tone="good" />
        <Kpi label="Saldo" value={CLP(saldo)} tone={saldo > 0 ? 'warn' : 'good'} />
        <Kpi label="Estado de pago" value={etiquetaEstadoPago(factura.estado_pago)} tone={factura.estado_pago === 'pagada' ? 'good' : 'warn'} />
      </div>
      <Card
        title={`Factura ${factura.folio ?? '—'}`}
        subtitle={factura.cliente ? `${factura.cliente.razon_social} · ${formatRut(factura.cliente.rut)}` : 'Sin cliente'}
        action={<Badge tone={tonoEstadoPago(factura.estado_pago)} dot>{etiquetaEstadoPago(factura.estado_pago)}</Badge>}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <div className="text-xs text-sina-muted">Emisión</div>
            <div>{fmtDate(factura.fecha_emision)}</div>
          </div>
          <div>
            <div className="text-xs text-sina-muted">Vencimiento</div>
            <div>{fmtDate(factura.fecha_vencimiento)}</div>
          </div>
          <div>
            <div className="text-xs text-sina-muted">Neto</div>
            <div className="num">{CLP(Number(factura.neto))}</div>
          </div>
          <div>
            <div className="text-xs text-sina-muted">IVA</div>
            <div className="num">{CLP(Number(factura.iva))}</div>
          </div>
        </div>
        <h4 className="text-[13px] font-semibold text-sina-ink mb-3">Pagos</h4>
        <PagosFactura pagos={factura.pagos} canAnular={canAnular} />
      </Card>
    </div>
  );
}
