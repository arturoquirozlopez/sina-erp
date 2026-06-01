import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { fmtDate, formatRut } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const SEGMENTOS = ['constructora','ferreteria','pintor','retail','industria','inmobiliaria','mayorista'] as const;
const SEGMENTO_LABEL: Record<string, string> = {
  constructora:'Constructora', ferreteria:'Ferretería', pintor:'Pintor', retail:'Retail',
  industria:'Industria', inmobiliaria:'Inmobiliaria', mayorista:'Mayorista',
};

export default async function ClientesPage({ searchParams }: { searchParams: { q?: string; segmento?: string; estado?: string } }) {
  await requirePermission('clientes.ver');
  const supabase = createClient();
  const q = (searchParams.q || '').trim();
  const segmento = searchParams.segmento || '';
  const estado = searchParams.estado || '';

  let query = supabase
    .from('clients')
    .select('id, razon_social, rut, contacto, email, telefono, comuna, segmento, estado, ejecutivo:profiles(nombre, apellido), updated_at', { count: 'exact' })
    .order('razon_social');
  if (q) query = query.or(`razon_social.ilike.%${q}%,rut.ilike.%${q}%,contacto.ilike.%${q}%,email.ilike.%${q}%`);
  if (segmento) query = query.eq('segmento', segmento);
  if (estado) query = query.eq('estado', estado);

  const { data: clientes, count } = await query.limit(200);

  const totales = await supabase.from('clients').select('estado', { count: 'exact' });
  const stats = {
    total: totales.count || 0,
    activos: (await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('estado','activo')).count || 0,
    riesgo: (await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('estado','riesgo_fuga')).count || 0,
    perdidos: (await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('estado','perdido')).count || 0,
  };

  return (
    <>
      <TopBar title="Clientes" subtitle="Cartera, segmentación y vista 360°" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi label="Clientes totales" value={stats.total} />
          <Kpi label="Activos" value={stats.activos} tone="good" />
          <Kpi label="Riesgo de fuga" value={stats.riesgo} tone={stats.riesgo>0?'warn':'neutral'} />
          <Kpi label="Perdidos" value={stats.perdidos} tone={stats.perdidos>0?'risk':'neutral'} />
        </div>

        <Card
          title="Cartera de clientes"
          action={<Link href="/clientes/nuevo"><Btn>Nuevo cliente</Btn></Link>}
        >
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Input name="q" placeholder="Buscar razón social, RUT, contacto..." defaultValue={q} />
            <Select name="segmento" defaultValue={segmento}>
              <option value="">Todos los segmentos</option>
              {SEGMENTOS.map(s => <option key={s} value={s}>{SEGMENTO_LABEL[s]}</option>)}
            </Select>
            <Select name="estado" defaultValue={estado}>
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="riesgo_fuga">Riesgo de fuga</option>
              <option value="perdido">Perdido</option>
            </Select>
            <Btn type="submit" variant="secondary" size="md">Filtrar</Btn>
          </form>

          {clientes && clientes.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
                <th className="pb-2 font-medium">Razón social</th>
                <th className="pb-2 font-medium">RUT</th>
                <th className="pb-2 font-medium">Segmento</th>
                <th className="pb-2 font-medium">Contacto</th>
                <th className="pb-2 font-medium">Ejecutivo</th>
                <th className="pb-2 font-medium">Estado</th>
                <th></th>
              </tr></thead>
              <tbody>
                {clientes.map((c: any) => (
                  <tr key={c.id} className="border-b border-sina-lineSoft hover:bg-sina-lineSoft/40">
                    <td className="py-3">
                      <div className="text-sina-ink">{c.razon_social}</div>
                      <div className="text-xs text-sina-muted">{c.comuna}</div>
                    </td>
                    <td className="font-mono text-xs">{formatRut(c.rut)}</td>
                    <td>{SEGMENTO_LABEL[c.segmento] || c.segmento}</td>
                    <td className="text-xs">{c.contacto}<div className="text-sina-muted">{c.email}</div></td>
                    <td className="text-xs">{c.ejecutivo ? `${c.ejecutivo.nombre} ${c.ejecutivo.apellido}` : '—'}</td>
                    <td>
                      <Badge tone={c.estado==='activo'?'mint':c.estado==='inactivo'?'neutral':c.estado==='riesgo_fuga'?'amber':'rose'} dot>
                        {c.estado.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="text-right text-xs">
                      <Link href={`/clientes/${c.id}`} className="text-sina-navy font-medium">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="Sin clientes"
              description={q || segmento || estado ? 'Ajusta los filtros o crea un nuevo cliente.' : 'Crea tu primer cliente para empezar.'}
              action={<Link href="/clientes/nuevo"><Btn>Nuevo cliente</Btn></Link>}
            />
          )}
        </Card>
      </div>
    </>
  );
}
