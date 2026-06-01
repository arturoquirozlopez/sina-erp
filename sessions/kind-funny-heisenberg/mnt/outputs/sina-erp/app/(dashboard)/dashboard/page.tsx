import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { CLP, fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const mes = new Date().toISOString().slice(0, 7);
  const year = String(new Date().getFullYear());

  const [{ data: ventasMes }, { data: ventasAnio }, { data: invValor }, { data: cxc }, { data: vencidas }] = await Promise.all([
    supabase.from('invoices').select('neto').gte('fecha_emision', mes + '-01').eq('estado_factura', 'emitida'),
    supabase.from('invoices').select('neto').gte('fecha_emision', year + '-01-01').eq('estado_factura', 'emitida'),
    supabase.from('inventory_stock').select('cantidad, product:products(costo)'),
    supabase.from('invoices').select('total').in('estado_pago', ['pendiente','parcial']),
    supabase.from('invoices').select('id, folio, total, fecha_vencimiento, client:clients(razon_social)').in('estado_pago', ['pendiente','parcial']).lt('fecha_vencimiento', new Date().toISOString().slice(0,10)).limit(10),
  ]);

  const sumVentasMes  = (ventasMes  ?? []).reduce((s, i) => s + Number(i.neto), 0);
  const sumVentasAnio = (ventasAnio ?? []).reduce((s, i) => s + Number(i.neto), 0);
  const valorInv      = (invValor   ?? []).reduce((s, r: any) => s + Number(r.product?.costo ?? 0) * r.cantidad, 0);
  const sumCxc        = (cxc        ?? []).reduce((s, i) => s + Number(i.total), 0);

  return (
    <>
      <TopBar title="Dashboard" subtitle="Visión integral del negocio" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi label="Ventas del mes" value={CLP(sumVentasMes)} />
          <Kpi label="Ventas año"    value={CLP(sumVentasAnio)} />
          <Kpi label="Inventario valorizado" value={CLP(valorInv)} />
          <Kpi label="Cuentas por cobrar"  value={CLP(sumCxc)} tone={sumCxc>0?'accent':'neutral'} />
        </div>

        <Card title="Facturas vencidas" subtitle="Top 10 por antigüedad">
          {vencidas && vencidas.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                <th className="pb-2 font-medium">Folio</th><th className="pb-2 font-medium">Cliente</th><th className="pb-2 font-medium">Vence</th><th className="pb-2 font-medium text-right">Total</th>
              </tr></thead>
              <tbody>{vencidas.map((i: any) => (
                <tr key={i.id} className="border-b border-sina-lineSoft">
                  <td className="py-3 font-mono text-xs">{i.folio}</td>
                  <td>{i.client?.razon_social}</td>
                  <td>{fmtDate(i.fecha_vencimiento)}</td>
                  <td className="text-right num">{CLP(Number(i.total))}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <div className="text-sm text-sina-muted">Sin facturas vencidas.</div>}
        </Card>
      </div>
    </>
  );
}
