import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requirePermission, can } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Kpi } from '@/components/ui/kpi';
import { EmptyState } from '@/components/ui/empty-state';
import { CLP, fmtDate, formatRut } from '@/lib/format';
import { etiquetaEstadoPago, tonoEstadoPago, pagoRechazado, sanearBusqueda, type PagoAnulable } from '@/lib/cobranza/anular-pago';
import { conVinculoBanco } from '@/lib/cobranza/load-factura';
import { PagosFactura } from '@/components/cobranza/pagos-factura';

export const dynamic = 'force-dynamic';

const ESTADOS = ['pendiente', 'parcial', 'pagada'] as const;

type Search = { q?: string; estado?: string };

export default async function CobranzaPage({ searchParams }: { searchParams: Search }) {
  const profile = await requirePermission('cobranza.ver');
  const canAnular = can(profile, 'cobranza.registrar_pago');
  const supabase = createClient();
  const q = sanearBusqueda(searchParams.q || '');
  const estado = ESTADOS.includes(searchParams.estado as typeof ESTADOS[number]) ? searchParams.estado! : '';

  let query = supabase
    .from('invoices')
    .select(`
      id, folio, fecha_emision, fecha_vencimiento, total, estado_pago,
      client:clients(razon_social, rut),
      payments(id, fecha, monto, metodo, referencia, conciliado, bank_transaction_id, estado_validacion, origen)
    `, { count: 'exact' })
    .order('fecha_emision', { ascending: false })
    .limit(200);

  if (estado) query = query.eq('estado_pago', estado);
  if (q && /^\d+$/.test(q)) query = query.eq('folio', Number(q));
  if (q && !/^\d+$/.test(q)) {
    const { data: clientes } = await supabase
      .from('clients')
      .select('id')
      .or(`razon_social.ilike.%${q}%,rut.ilike.%${q}%`)
      .limit(50);
    const ids = (clientes ?? []).map(c => c.id);
    if (ids.length === 0) {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    } else {
      query = query.in('client_id', ids);
    }
  }

  const [{ data: facturas, count, error }, pendientes, parciales, pagadas] = await Promise.all([
    query,
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('estado_pago', 'pendiente'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('estado_pago', 'parcial'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('estado_pago', 'pagada'),
  ]);

  const mostrarPagos = estado === 'pagada' || estado === 'parcial';
  const base = (facturas ?? []).map(factura => {
    const cliente = Array.isArray(factura.client) ? factura.client[0] : factura.client;
    return { ...factura, cliente, pagos: (factura.payments ?? []) as PagoAnulable[] };
  });
  const marcados = mostrarPagos
    ? await conVinculoBanco(base.flatMap(factura => factura.pagos))
    : [];
  const pagoPorId = new Map(marcados.map(pago => [pago.id, pago]));
  const filas = base.map(factura => ({
    ...factura,
    pagos: factura.pagos.map(pago => pagoPorId.get(pago.id) ?? pago),
  }));

  return (
    <>
      <TopBar title="Cobranza" subtitle="Cuentas por cobrar" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/cobranza?estado=pendiente"><Kpi label="Pendientes" value={pendientes.count || 0} tone="warn" /></Link>
          <Link href="/cobranza?estado=parcial"><Kpi label="Parciales" value={parciales.count || 0} tone="accent" /></Link>
          <Link href="/cobranza?estado=pagada"><Kpi label="Pagadas" value={pagadas.count || 0} tone="good" /></Link>
        </div>

        <Card
          title={estado === 'pagada' ? 'Facturas pagadas' : 'Facturas'}
          subtitle={estado === 'pagada'
            ? 'Anular un pago marcado por error. La factura vuelve a Pendiente o Parcial sola.'
            : `${count ?? filas.length} factura(s)`}
        >
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Input name="q" placeholder="Folio, cliente o RUT" defaultValue={q} />
            <Select name="estado" defaultValue={estado}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="pagada">Pagada</option>
            </Select>
            <Btn type="submit" variant="secondary">Filtrar</Btn>
          </form>

          {error && <div className="text-xs text-sina-rose mb-3">Error: {error.message}</div>}

          {filas.length === 0 ? (
            <EmptyState title="Sin facturas" description="No hay facturas con ese filtro." />
          ) : (
            <div className="space-y-6">
              {filas.map(factura => (
                <div key={factura.id} className="border-b border-sina-lineSoft pb-4 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link href={`/cobranza/${factura.id}`} className="font-mono text-xs text-sina-navy font-semibold">
                        {factura.folio ?? '—'}
                      </Link>
                      <div className="font-medium">{factura.cliente?.razon_social || '—'}</div>
                      <div className="text-xs text-sina-muted font-mono">{factura.cliente?.rut ? formatRut(factura.cliente.rut) : ''}</div>
                    </div>
                    <div className="text-sm text-sina-muted">{fmtDate(factura.fecha_emision)}</div>
                    <div className="text-right num font-semibold">{CLP(Number(factura.total))}</div>
                    <Badge tone={tonoEstadoPago(factura.estado_pago)} dot>{etiquetaEstadoPago(factura.estado_pago)}</Badge>
                    <Link href={`/cobranza/${factura.id}`} className="text-xs font-semibold text-sina-navy">Ver</Link>
                  </div>
                  {(estado === 'pagada' || estado === 'parcial') && (
                    <div className="mt-3">
                      <PagosFactura pagos={factura.pagos.filter(p => estado === 'pagada' ? !pagoRechazado(p) : true)} canAnular={canAnular} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
