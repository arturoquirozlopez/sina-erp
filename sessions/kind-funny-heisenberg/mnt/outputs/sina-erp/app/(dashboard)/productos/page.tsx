import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CLP, PCT } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const CATEGORIAS = ['Látex','Esmalte al agua','Esmalte sintético','Óleo','Barniz','Anticorrosivo','Selladores','Diluyentes','Accesorios'];

export default async function ProductosPage({ searchParams }: { searchParams: { q?: string; cat?: string } }) {
  await requirePermission('inventario.ver');
  const supabase = createClient();
  const q = (searchParams.q || '').trim();
  const cat = searchParams.cat || '';

  let query = supabase
    .from('products')
    .select('id, sku, nombre, categoria, color, formato, costo, precio, stock_min, activo')
    .eq('activo', true)
    .order('sku');
  if (q) query = query.or(`sku.ilike.%${q}%,nombre.ilike.%${q}%,color.ilike.%${q}%`);
  if (cat) query = query.eq('categoria', cat);

  const { data: productos } = await query.limit(200);

  // Stock total por producto
  const { data: stocks } = await supabase.from('inventory_stock').select('product_id, cantidad');
  const stockByProduct: Record<string, number> = {};
  (stocks ?? []).forEach((s: any) => { stockByProduct[s.product_id] = (stockByProduct[s.product_id] ?? 0) + s.cantidad; });

  const total      = productos?.length ?? 0;
  const bajoStock  = productos?.filter(p => (stockByProduct[p.id] ?? 0) < p.stock_min).length ?? 0;
  const sinStock   = productos?.filter(p => (stockByProduct[p.id] ?? 0) === 0).length ?? 0;
  const inventarioValorizado = productos?.reduce((sum, p) => sum + Number(p.costo) * (stockByProduct[p.id] ?? 0), 0) ?? 0;

  return (
    <>
      <TopBar title="Productos e Inventario" subtitle="Catálogo, costos, precios y stock" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi label="SKUs activos" value={total} />
          <Kpi label="Inventario valorizado" value={CLP(inventarioValorizado)} />
          <Kpi label="Bajo stock" value={bajoStock} tone={bajoStock>0?'warn':'neutral'} />
          <Kpi label="Sin stock" value={sinStock} tone={sinStock>0?'risk':'neutral'} />
        </div>

        <Card
          title="Catálogo de productos"
          action={<Link href="/productos/nuevo"><Btn>Nuevo producto</Btn></Link>}
        >
          <form method="get" className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input name="q" placeholder="Buscar SKU, nombre, color..." defaultValue={q} />
            <Select name="cat" defaultValue={cat}>
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </Select>
            <Btn type="submit" variant="secondary" size="md">Filtrar</Btn>
          </form>

          {productos && productos.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                <th className="pb-2 font-medium">SKU</th>
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium">Categoría</th>
                <th className="pb-2 font-medium text-right">Costo</th>
                <th className="pb-2 font-medium text-right">Precio</th>
                <th className="pb-2 font-medium text-right">Margen</th>
                <th className="pb-2 font-medium text-right">Stock</th>
                <th className="pb-2 font-medium">Estado</th>
              </tr></thead>
              <tbody>
                {productos.map((p: any) => {
                  const stock = stockByProduct[p.id] ?? 0;
                  const margen = p.precio > 0 ? (p.precio - p.costo) / p.precio : 0;
                  let stockState: { label: string; tone: any } = { label: 'Saludable', tone: 'mint' };
                  if (stock <= 0) stockState = { label: 'Sin stock', tone: 'rose' };
                  else if (stock < p.stock_min * 0.5) stockState = { label: 'Riesgo de quiebre', tone: 'rose' };
                  else if (stock < p.stock_min) stockState = { label: 'Bajo stock', tone: 'amber' };
                  return (
                    <tr key={p.id} className="border-b border-sina-lineSoft hover:bg-sina-lineSoft/40">
                      <td className="py-3 font-mono text-xs text-sina-muted"><Link href={`/productos/${p.id}`} className="hover:text-sina-navy">{p.sku}</Link></td>
                      <td><Link href={`/productos/${p.id}`} className="hover:text-sina-navy"><div className="text-sina-ink">{p.nombre}</div><div className="text-xs text-sina-muted">{p.color} · {p.formato}</div></Link></td>
                      <td className="text-sina-body">{p.categoria}</td>
                      <td className="text-right num">{CLP(Number(p.costo))}</td>
                      <td className="text-right num">{CLP(Number(p.precio))}</td>
                      <td className="text-right num text-sina-mint">{PCT(margen)}</td>
                      <td className="text-right num font-medium">{stock}</td>
                      <td><Badge tone={stockState.tone} dot>{stockState.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="Sin productos"
              description="Crea tu primer producto para empezar a vender."
              action={<Link href="/productos/nuevo"><Btn>Nuevo producto</Btn></Link>}
            />
          )}
        </Card>
      </div>
    </>
  );
}
