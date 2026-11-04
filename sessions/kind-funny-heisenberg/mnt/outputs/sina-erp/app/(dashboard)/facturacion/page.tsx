import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CLP, fmtDate, formatRut } from '@/lib/format';
import { etiquetaEstadoPago, tonoEstadoPago, sanearBusqueda } from '@/lib/cobranza/anular-pago';

export const dynamic = 'force-dynamic';

const ESTADOS = ['pendiente', 'parcial', 'pagada'] as const;

export default async function FacturacionPage({ searchParams }: { searchParams: { q?: string; estado?: string } }) {
  await requirePermission('facturacion.ver');
  const supabase = createClient();
  const q = sanearBusqueda(searchParams.q || '');
  const estado = ESTADOS.includes(searchParams.estado as typeof ESTADOS[number]) ? searchParams.estado! : '';

  let query = supabase
    .from('invoices')
    .select('id, folio, fecha_emision, fecha_vencimiento, total, estado_pago, estado_factura, client:clients(razon_social, rut)', { count: 'exact' })
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
    query = ids.length ? query.in('client_id', ids) : query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { data, count, error } = await query;

  return (
    <>
      <TopBar title="Facturación" subtitle="DTE y estado de pago" />
      <div className="p-8 space-y-6">
        <Card title="Facturas" subtitle={`${count ?? data?.length ?? 0} documento(s)`}>
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Input name="q" placeholder="Folio, cliente o RUT" defaultValue={q} />
            <Select name="estado" defaultValue={estado}>
              <option value="">Todos los pagos</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="pagada">Pagada</option>
            </Select>
            <Btn type="submit" variant="secondary">Filtrar</Btn>
            <div className="text-right self-center">
              <Link href="/facturacion?estado=pagada" className="text-xs font-semibold text-sina-navy">Ver pagadas</Link>
            </div>
          </form>
          {error && <div className="text-xs text-sina-rose mb-3">Error: {error.message}</div>}
          {!data?.length ? (
            <EmptyState title="Sin facturas" description="No hay documentos con ese filtro." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                  <th className="pb-2 font-medium">Folio</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Emisión</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium">Pago</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.map(factura => {
                  const cliente = Array.isArray(factura.client) ? factura.client[0] : factura.client;
                  return (
                    <tr key={factura.id} className="border-b border-sina-lineSoft">
                      <td className="py-2 font-mono text-xs">{factura.folio ?? '—'}</td>
                      <td>
                        <div className="font-medium">{cliente?.razon_social || '—'}</div>
                        <div className="text-xs text-sina-muted font-mono">{cliente?.rut ? formatRut(cliente.rut) : ''}</div>
                      </td>
                      <td>{fmtDate(factura.fecha_emision)}</td>
                      <td className="text-right num font-semibold">{CLP(Number(factura.total))}</td>
                      <td><Badge tone={tonoEstadoPago(factura.estado_pago)} dot>{etiquetaEstadoPago(factura.estado_pago)}</Badge></td>
                      <td className="text-right">
                        <Link href={`/facturacion/${factura.id}`} className="text-xs font-semibold text-sina-navy">Ver</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
