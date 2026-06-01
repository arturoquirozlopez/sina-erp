import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage() {
  await requirePermission('usuarios.gestionar');
  const supabase = createClient();
  const { data: logs } = await supabase
    .from('audit_log')
    .select('id, accion, modulo, detalle, created_at, user:profiles(nombre, apellido)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="p-8 space-y-6">
      <Card title="Auditoría" subtitle="Logs de logins, cambios de permisos y eventos críticos">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
            <th className="pb-2 font-medium">Fecha</th><th className="pb-2 font-medium">Usuario</th><th className="pb-2 font-medium">Módulo</th><th className="pb-2 font-medium">Acción</th><th className="pb-2 font-medium">Detalle</th>
          </tr></thead>
          <tbody>
            {(logs ?? []).map((l: any) => (
              <tr key={l.id} className="border-b border-sina-lineSoft">
                <td className="py-3 text-xs">{fmtDate(l.created_at)}</td>
                <td className="text-xs">{l.user ? `${l.user.nombre} ${l.user.apellido}` : '—'}</td>
                <td className="text-xs text-sina-body">{l.modulo}</td>
                <td><Badge tone={l.accion.includes('login')?'sky':l.accion.includes('eliminar')||l.accion.includes('desactivar')?'rose':'navy'}>{l.accion}</Badge></td>
                <td className="text-sina-body">{l.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
