import { createClient } from '@/lib/supabase/server';
import { requirePermission, can, getCurrentProfile } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { CLP, fmtDate, formatRut } from '@/lib/format';
import { ClienteForm } from '../cliente-form';
import { upsertClienteAction, deleteClienteAction, addClienteNotaAction } from '../actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  await requirePermission('clientes.ver');
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data: cliente } = await supabase
    .from('clients')
    .select('*, ejecutivo:profiles(nombre, apellido)')
    .eq('id', params.id)
    .maybeSingle();
  if (!cliente) notFound();

  const [{ data: facturas }, { data: notas }, { data: ovs }] = await Promise.all([
    supabase.from('invoices').select('id, folio, total, neto, fecha_emision, estado_pago').eq('client_id', params.id).order('fecha_emision', { ascending: false }).limit(20),
    supabase.from('client_notes').select('id, tipo, nota, fecha, user:profiles(nombre)').eq('client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('sales_orders').select('id, numero, total, fecha, estado').eq('client_id', params.id).order('fecha', { ascending: false }).limit(10),
  ]);

  const totalCompras = (facturas ?? []).reduce((s, f) => s + Number(f.neto), 0);
  const ultimaCompra = facturas?.[0]?.fecha_emision || null;
  const facturasPendientes = (facturas ?? []).filter(f => f.estado_pago !== 'pagada').length;

  return (
    <>
      <TopBar
        title={cliente.razon_social}
        subtitle={`RUT ${formatRut(cliente.rut)}`}
        actions={can(profile, 'clientes.editar') && (
          <Link href={`/clientes/${cliente.id}/editar`}><Btn variant="secondary" size="md">Editar</Btn></Link>
        )}
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi label="Compras totales" value={CLP(totalCompras)} />
          <Kpi label="Última compra" value={fmtDate(ultimaCompra)} />
          <Kpi label="Facturas pendientes" value={facturasPendientes} tone={facturasPendientes>0?'warn':'neutral'} />
          <Kpi label="Estado" value={cliente.estado.replace('_',' ')} tone={cliente.estado==='activo'?'good':cliente.estado==='riesgo_fuga'?'warn':cliente.estado==='perdido'?'risk':'neutral'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Datos de contacto" className="lg:col-span-1">
            <dl className="text-sm space-y-2">
              <div><dt className="text-xs text-sina-muted">Contacto</dt><dd>{cliente.contacto || '—'}</dd></div>
              <div><dt className="text-xs text-sina-muted">Email</dt><dd>{cliente.email || '—'}</dd></div>
              <div><dt className="text-xs text-sina-muted">Teléfono</dt><dd>{cliente.telefono || '—'}</dd></div>
              <div><dt className="text-xs text-sina-muted">Dirección</dt><dd>{cliente.direccion}, {cliente.comuna}, {cliente.ciudad}</dd></div>
              <div><dt className="text-xs text-sina-muted">Segmento</dt><dd>{cliente.segmento}</dd></div>
              <div><dt className="text-xs text-sina-muted">Ejecutivo</dt><dd>{cliente.ejecutivo ? `${cliente.ejecutivo.nombre} ${cliente.ejecutivo.apellido}` : '—'}</dd></div>
            </dl>
          </Card>

          <Card title="Notas y seguimiento" className="lg:col-span-2">
            {can(profile, 'clientes.editar') && (
              <form action={async (fd) => { await addClienteNotaAction(fd); }} className="flex gap-2 mb-3">
                <input type="hidden" name="client_id" value={cliente.id} />
                <Select name="tipo" defaultValue="Llamada" className="!w-32">
                  <option>Llamada</option><option>Visita</option><option>Email</option><option>WhatsApp</option><option>Reunion</option>
                </Select>
                <Input name="nota" placeholder="Escribir nota..." className="flex-1" />
                <Btn type="submit" size="md">Agregar</Btn>
              </form>
            )}
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar">
              {(notas ?? []).map((n: any) => (
                <div key={n.id} className="p-3 rounded-lg border border-sina-line flex gap-3">
                  <Badge tone="sky">{n.tipo}</Badge>
                  <div className="flex-1">
                    <div className="text-sm">{n.nota}</div>
                    <div className="text-xs text-sina-muted mt-1">{n.user?.nombre || '—'} · {fmtDate(n.fecha)}</div>
                  </div>
                </div>
              ))}
              {(!notas || notas.length === 0) && <div className="text-sm text-sina-muted">Sin notas registradas.</div>}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Órdenes de venta recientes">
            {ovs && ovs.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                  <th className="pb-2 font-medium">N°</th><th className="pb-2 font-medium">Fecha</th><th className="pb-2 font-medium text-right">Total</th><th className="pb-2 font-medium">Estado</th>
                </tr></thead>
                <tbody>
                  {ovs.map((o: any) => (
                    <tr key={o.id} className="border-b border-sina-lineSoft">
                      <td className="py-2 font-mono text-xs">{o.numero}</td>
                      <td>{fmtDate(o.fecha)}</td>
                      <td className="text-right num">{CLP(Number(o.total))}</td>
                      <td><Badge tone={o.estado==='pagada'?'mint':'sky'} dot>{o.estado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="text-sm text-sina-muted">Sin órdenes de venta.</div>}
          </Card>

          <Card title="Facturas recientes">
            {facturas && facturas.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                  <th className="pb-2 font-medium">Folio</th><th className="pb-2 font-medium">Fecha</th><th className="pb-2 font-medium text-right">Total</th><th className="pb-2 font-medium">Pago</th>
                </tr></thead>
                <tbody>
                  {facturas.map((f: any) => (
                    <tr key={f.id} className="border-b border-sina-lineSoft">
                      <td className="py-2 font-mono text-xs">{f.folio}</td>
                      <td>{fmtDate(f.fecha_emision)}</td>
                      <td className="text-right num">{CLP(Number(f.total))}</td>
                      <td><Badge tone={f.estado_pago==='pagada'?'mint':'amber'} dot>{f.estado_pago}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="text-sm text-sina-muted">Sin facturas.</div>}
          </Card>
        </div>

        {can(profile, 'clientes.eliminar') && (
          <Card title="Zona peligrosa">
            <form action={async () => { 'use server'; await deleteClienteAction(cliente.id); }}>
              <Btn type="submit" variant="danger" size="sm">Eliminar cliente</Btn>
              <p className="text-xs text-sina-muted mt-2">Esta acción no se puede deshacer.</p>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
