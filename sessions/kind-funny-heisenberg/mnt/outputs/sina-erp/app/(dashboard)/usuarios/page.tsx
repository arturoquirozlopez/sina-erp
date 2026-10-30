import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { fmtDate } from '@/lib/format';
import { toggleUserActiveAction, updateUserRoleAction } from './actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  await requirePermission('usuarios.gestionar');
  const supabase = createClient();
  const [{ data: users }, { data: roles }, { data: invitations }] = await Promise.all([
    supabase.from('profiles').select('id, email, nombre, apellido, cargo, area, telefono, ultimo_login, activo, role:roles(id,nombre)').order('created_at'),
    supabase.from('roles').select('id, nombre').order('id'),
    supabase.from('user_invitations').select('id', { count: 'exact' }).eq('status', 'pending'),
  ]);

  const total   = users?.length ?? 0;
  const activos = users?.filter(u => u.activo).length ?? 0;
  const pendientes = invitations?.length ?? 0;

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi label="Usuarios"      value={total} />
        <Kpi label="Activos"       value={activos} tone="good" />
        <Kpi label="Invitaciones pendientes" value={pendientes} tone={pendientes>0?'accent':'neutral'} />
        <Kpi label="Roles configurados" value={roles?.length ?? 0} />
      </div>

      <Card
        title="Usuarios"
        subtitle="Para agregar nuevos usuarios envía una invitación. Cada usuario crea su propia contraseña al activar."
        action={<Link href="/usuarios/invitaciones"><Btn variant="secondary" size="md">Invitar usuario</Btn></Link>}
      >
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
            <th className="pb-2 font-medium">Nombre</th><th className="pb-2 font-medium">Email</th><th className="pb-2 font-medium">Cargo · Área</th><th className="pb-2 font-medium">Rol</th><th className="pb-2 font-medium">Último login</th><th className="pb-2 font-medium">Estado</th><th></th>
          </tr></thead>
          <tbody>
            {(users ?? []).map((u: any) => (
              <tr key={u.id} className="border-b border-sina-lineSoft">
                <td className="py-3">
                  <div className="text-sina-ink">{u.nombre} {u.apellido}</div>
                  <div className="text-xs text-sina-muted">{u.telefono}</div>
                </td>
                <td className="text-xs">{u.email}</td>
                <td className="text-xs">{u.cargo}<div className="text-sina-muted">{u.area}</div></td>
                <td>
                  <form action={async (fd) => { await updateUserRoleAction(fd); }} className="inline-block">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="roleId" defaultValue={u.role?.id} className="text-xs px-2 py-1 rounded border border-sina-line bg-white" onChange={(e) => e.currentTarget.form?.requestSubmit()}>
                      {(roles ?? []).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </form>
                </td>
                <td className="text-xs text-sina-muted">{u.ultimo_login ? fmtDate(u.ultimo_login) : '—'}</td>
                <td><Badge tone={u.activo ? 'mint' : 'neutral'} dot>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                <td className="text-right text-xs">
                  <form action={async () => { 'use server'; await toggleUserActiveAction(u.id); }}>
                    <button type="submit" className="text-sina-body font-medium hover:text-sina-rose">
                      {u.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
