import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { TopBar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requirePermission('puntos_retiro.ver');
  const supabase = createClient();
  const { data, error } = await supabase.from('pickup_points').select('*', { count: 'exact' }).limit(50);
  return (
    <>
      <TopBar title="Puntos de Retiro" subtitle="Bodegas y puntos físicos" />
      <div className="p-8 space-y-6">
        <Card title="Puntos de Retiro" subtitle="Módulo en migración · lectura real desde Supabase ya cableada">
          <p className="text-sm text-sina-body mb-3">
            Tabla <code className="bg-sina-bg px-1 rounded">pickup_points</code> · {data?.length ?? 0} registros encontrados.
            La UI completa de este módulo está implementada en el prototipo `sina-app.html` y debe portarse siguiendo el patrón
            de <code className="bg-sina-bg px-1 rounded">/clientes</code> o <code className="bg-sina-bg px-1 rounded">/productos</code>:
            page.tsx (lectura) + actions.ts (server actions con zod + audit) + form client component.
          </p>
          {error && <div className="text-xs text-sina-rose mb-3">Error: {error.message}</div>}
          {data && data.length > 0 ? (
            <pre className="text-xs bg-sina-bg p-3 rounded overflow-auto max-h-96">{JSON.stringify(data.slice(0, 5), null, 2)}</pre>
          ) : (
            <EmptyState title="Sin datos en pickup_points" description="Aún no hay registros. Carga datos para empezar." />
          )}
        </Card>
      </div>
    </>
  );
}
