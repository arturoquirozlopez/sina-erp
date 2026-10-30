import { createClient } from '@/lib/supabase/server';
import { requirePermission, can, getCurrentProfile } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { CLP, PCT, fmtDate } from '@/lib/format';
import { inventoryMovementAction, deleteProductAction } from '../actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductoDetailPage({ params }: { params: { id: string } }) {
  await requirePermission('inventario.ver');
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data: p } = await supabase
    .from('products')
    .select('*, proveedor:suppliers(nombre, pais, lead_time_dias)')
    .eq('id', params.id)
    .maybeSingle();
  if (!p) notFound();

  const [{ data: stocks }, { data: movs }, { data: pickups }] = await Promise.all([
    supabase.from('inventory_stock').select('location_id, cantidad, location:pickup_points(nombre)').eq('product_id', params.id),
    supabase.from('inventory_movements').select('id, tipo, cantidad, motivo, fecha, location_id, user:profiles(nombre, apellido)').eq('product_id', params.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('pickup_points').select('id, nombre').eq('estado', 'activo'),
  ]);

  const stockTotal = (stocks ?? []).reduce((s, x) => s + x.cantidad, 0);
  const margen = p.precio > 0 ? (Number(p.precio) - Number(p.costo)) / Number(p.precio) : 0;
  let estadoStock: any = { label: 'Saludable', tone: 'mint' };
  if (stockTotal <= 0) estadoStock = { label: 'Sin stock', tone: 'rose' };
  else if (stockTotal < p.stock_min * 0.5) estadoStock = { label: 'Riesgo de quiebre', tone: 'rose' };
  else if (stockTotal < p.stock_min) estadoStock = { label: 'Bajo stock', tone: 'amber' };

  return (
    <>
      <TopBar
        title={p.nombre}
        subtitle={`${p.sku} · ${p.categoria}`}
        actions={can(profile, 'inventario.editar') && <Link href={`/productos/${p.id}/editar`}><Btn variant="secondary" size="md">Editar</Btn></Link>}
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi label="Stock total" value={stockTotal} sub={estadoStock.label} tone={estadoStock.tone} />
          <Kpi label="Precio" value={CLP(Number(p.precio))} sub={`Costo ${CLP(Number(p.costo))}`} />
          <Kpi label="Margen" value={PCT(margen)} tone="good" />
          <Kpi label="Stock mínimo" value={p.stock_min} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Información comercial">
            <dl className="text-sm space-y-2">
              <div><dt className="text-xs text-sina-muted">SKU</dt><dd className="font-mono">{p.sku}</dd></div>
              <div><dt className="text-xs text-sina-muted">Categoría</dt><dd>{p.categoria}</dd></div>
              <div><dt className="text-xs text-sina-muted">Color · Formato</dt><dd>{p.color || '—'} · {p.formato || '—'}</dd></div>
              <div><dt className="text-xs text-sina-muted">Acabado</dt><dd>{p.acabado || '—'}</dd></div>
              <div><dt className="text-xs text-sina-muted">Proveedor</dt><dd>{p.proveedor?.nombre || '—'}</dd></div>
              {p.descripcion && <div><dt className="text-xs text-sina-muted">Descripción</dt><dd className="text-sina-body">{p.descripcion}</dd></div>}
            </dl>
          </Card>

          <Card title="Stock por ubicación">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                <th className="pb-2 font-medium">Ubicación</th>
                <th className="pb-2 font-medium text-right">Cantidad</th>
              </tr></thead>
              <tbody>
                {(stocks ?? []).map((s: any) => (
                  <tr key={s.location_id} className="border-b border-sina-lineSoft">
                    <td className="py-2">{s.location?.nombre || s.location_id}</td>
                    <td className="text-right num font-medium">{s.cantidad}</td>
                  </tr>
                ))}
                <tr className="border-t border-sina-line">
                  <td className="py-2 font-semibold">Total</td>
                  <td className="text-right num font-semibold">{stockTotal}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          {can(profile, 'inventario.editar') && (
            <Card title="Registrar movimiento">
              <form action={async (fd) => { await inventoryMovementAction(fd); }} className="space-y-3">
                <input type="hidden" name="product_id" value={p.id} />
                <Select label="Tipo" name="tipo" defaultValue="entrada">
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste (set total)</option>
                </Select>
                <Select label="Ubicación" name="location_id" defaultValue="BC">
                  {(pickups ?? []).map(pp => <option key={pp.id} value={pp.id}>{pp.nombre}</option>)}
                </Select>
                <Input label="Cantidad" name="cantidad" type="number" min="0" required defaultValue={0} />
                <Input label="Motivo" name="motivo" placeholder="Recepción / Venta / Ajuste físico..." />
                <Btn type="submit" className="w-full">Registrar movimiento</Btn>
              </form>
            </Card>
          )}
        </div>

        <Card title="Historial de movimientos">
          {movs && movs.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Ubicación</th>
                <th className="pb-2 font-medium text-right">Cantidad</th>
                <th className="pb-2 font-medium">Motivo</th>
                <th className="pb-2 font-medium">Usuario</th>
              </tr></thead>
              <tbody>
                {movs.map((m: any) => (
                  <tr key={m.id} className="border-b border-sina-lineSoft">
                    <td className="py-2 text-xs">{fmtDate(m.fecha)}</td>
                    <td><Badge tone={m.tipo==='entrada'?'mint':m.tipo==='salida'?'rose':'amber'}>{m.tipo}</Badge></td>
                    <td className="text-xs">{m.location_id}</td>
                    <td className="text-right num font-medium">{m.tipo==='entrada'?'+':m.tipo==='salida'?'-':'='}{m.cantidad}</td>
                    <td className="text-xs text-sina-body">{m.motivo}</td>
                    <td className="text-xs">{m.user ? `${m.user.nombre}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="text-sm text-sina-muted">Sin movimientos registrados.</div>}
        </Card>

        {can(profile, 'inventario.eliminar') && (
          <Card title="Zona peligrosa">
            <form action={async () => { 'use server'; await deleteProductAction(p.id); }}>
              <Btn type="submit" variant="danger" size="sm">Eliminar producto</Btn>
              <p className="text-xs text-sina-muted mt-2">Esta acción no se puede deshacer.</p>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
