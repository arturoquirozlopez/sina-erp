import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { Badge } from '@/components/ui/badge';
import { Btn } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { fmtDate } from '@/lib/format';
import { inviteUserAction, resendInvitationAction, cancelInvitationAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function InvitacionesPage() {
  await requirePermission('usuarios.gestionar');
  const supabase = createClient();
  const admin = createAdminClient();

  // Marcar como expiradas las pasadas de fecha (idempotente)
  await admin.from('user_invitations').update({ status: 'expired' })
    .eq('status', 'pending').lt('expires_at', new Date().toISOString());

  const [{ data: invitations }, { data: roles }] = await Promise.all([
    supabase.from('user_invitations').select('*, role:roles(nombre), inviter:profiles!user_invitations_invited_by_fkey(nombre, apellido)').order('created_at', { ascending: false }),
    supabase.from('roles').select('id, nombre').order('id'),
  ]);

  const pending   = invitations?.filter(i => i.status === 'pending').length ?? 0;
  const accepted  = invitations?.filter(i => i.status === 'accepted').length ?? 0;
  const expired   = invitations?.filter(i => i.status === 'expired').length ?? 0;
  const cancelled = invitations?.filter(i => i.status === 'cancelled').length ?? 0;

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Kpi label="Total invitaciones" value={invitations?.length ?? 0} />
        <Kpi label="Pendientes" value={pending} tone={pending>0?'accent':'neutral'} />
        <Kpi label="Aceptadas"  value={accepted} tone="good" />
        <Kpi label="Expiradas"  value={expired} tone={expired>0?'warn':'neutral'} />
        <Kpi label="Canceladas" value={cancelled} />
      </div>

      <Card title="Nueva invitación" subtitle="El usuario recibirá un email con un enlace de activación seguro válido 7 días.">
        <form action={async (fd) => { await inviteUserAction(fd); }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Nombre"   name="firstName" required />
          <Input label="Apellido" name="lastName"  required />
          <Input label="Email"    name="email" type="email" required />
          <Input label="Cargo"    name="cargo" />
          <Input label="Área"     name="area" />
          <Select label="Rol inicial" name="roleId" required defaultValue="R5">
            {(roles ?? []).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Select>
          <div className="md:col-span-3 flex justify-end pt-2 border-t border-sina-line">
            <Btn type="submit">Enviar invitación</Btn>
          </div>
        </form>
      </Card>

      <Card title="Invitaciones">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
            <th className="pb-2 font-medium">Email</th><th className="pb-2 font-medium">Nombre</th><th className="pb-2 font-medium">Rol</th><th className="pb-2 font-medium">Invitado por</th><th className="pb-2 font-medium">Creada</th><th className="pb-2 font-medium">Expira</th><th className="pb-2 font-medium">Estado</th><th></th>
          </tr></thead>
          <tbody>
            {(invitations ?? []).map((inv: any) => (
              <tr key={inv.id} className="border-b border-sina-lineSoft">
                <td className="py-3 text-sina-ink">{inv.email}</td>
                <td>{inv.first_name} {inv.last_name}</td>
                <td><Badge tone="navy">{inv.role?.nombre || '—'}</Badge></td>
                <td className="text-xs text-sina-body">{inv.inviter ? `${inv.inviter.nombre} ${inv.inviter.apellido}` : '—'}</td>
                <td className="text-xs">{fmtDate(inv.created_at)}</td>
                <td className="text-xs">{fmtDate(inv.expires_at)}</td>
                <td>
                  <Badge tone={inv.status==='accepted'?'mint':inv.status==='pending'?'sky':inv.status==='expired'?'amber':'rose'} dot>
                    {({pending:'Pendiente',accepted:'Aceptada',expired:'Expirada',cancelled:'Cancelada'} as any)[inv.status]}
                  </Badge>
                </td>
                <td className="text-right text-xs space-x-2">
                  {(inv.status==='pending' || inv.status==='expired') && (
                    <form action={async () => { 'use server'; await resendInvitationAction(inv.id); }} className="inline">
                      <button type="submit" className="text-sina-navy font-medium">Reenviar</button>
                    </form>
                  )}
                  {inv.status==='pending' && (
                    <form action={async () => { 'use server'; await cancelInvitationAction(inv.id); }} className="inline">
                      <button type="submit" className="text-sina-rose font-medium">Cancelar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!invitations || invitations.length===0) && <div className="text-sm text-sina-muted text-center py-8">Sin invitaciones aún.</div>}
      </Card>
    </div>
  );
}
