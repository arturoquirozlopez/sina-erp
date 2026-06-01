'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken } from '@/lib/auth/tokens';
import { sendEmail } from '@/lib/email';
import { buildInviteEmail } from '@/lib/email/templates';
import { requirePermission, audit, getCurrentProfile } from '@/lib/auth/permissions';

const InviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  cargo: z.string().optional().default(''),
  area: z.string().optional().default(''),
  roleId: z.string().min(1),
});

export async function inviteUserAction(formData: FormData) {
  const me = await requirePermission('usuarios.gestionar');
  const input = InviteSchema.parse({
    email: String(formData.get('email') || '').toLowerCase(),
    firstName: String(formData.get('firstName') || ''),
    lastName: String(formData.get('lastName') || ''),
    cargo: String(formData.get('cargo') || ''),
    area: String(formData.get('area') || ''),
    roleId: String(formData.get('roleId') || ''),
  });

  const admin = createAdminClient();

  // Verificar duplicados
  const { data: existing } = await admin.from('profiles').select('id').eq('email', input.email).maybeSingle();
  if (existing) return { error: 'Ya existe un usuario activo con ese email' };
  const { data: pending } = await admin.from('user_invitations').select('id').eq('email', input.email).eq('status', 'pending').maybeSingle();
  if (pending) return { error: 'Ya existe una invitación pendiente para ese email' };

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();

  const { data: inv, error } = await admin.from('user_invitations').insert({
    email: input.email, first_name: input.firstName, last_name: input.lastName,
    cargo: input.cargo, area: input.area, role_id: input.roleId,
    invited_by: me.id, invitation_token: token, expires_at: expiresAt,
  }).select().single();
  if (error || !inv) return { error: error?.message || 'No se pudo crear la invitación' };

  const { data: role } = await admin.from('roles').select('nombre').eq('id', input.roleId).single();
  await sendEmail(buildInviteEmail({
    to: input.email, firstName: input.firstName, lastName: input.lastName,
    roleName: role?.nombre || '—', token, invitedByName: `${me.nombre} ${me.apellido}`,
  }), 'invite');

  await audit({ accion: 'enviar_invitacion', modulo: 'usuarios', registroId: inv.id, registroTipo: 'user_invitations', detalle: `Invitación a ${input.email}` });
  revalidatePath('/usuarios/invitaciones');
  return { ok: true };
}

export async function resendInvitationAction(id: string) {
  const me = await requirePermission('usuarios.gestionar');
  const admin = createAdminClient();
  const { data: inv } = await admin.from('user_invitations').select('*').eq('id', id).single();
  if (!inv) return { error: 'No encontrada' };

  const newToken = generateSecureToken();
  const newExpiry = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
  await admin.from('user_invitations').update({
    invitation_token: newToken, expires_at: newExpiry, status: 'pending',
    last_resent_at: new Date().toISOString(),
  }).eq('id', id);

  const { data: role } = await admin.from('roles').select('nombre').eq('id', inv.role_id).single();
  await sendEmail(buildInviteEmail({
    to: inv.email, firstName: inv.first_name, lastName: inv.last_name,
    roleName: role?.nombre || '—', token: newToken, invitedByName: `${me.nombre} ${me.apellido}`,
  }), 'invite');

  await audit({ accion: 'reenviar_invitacion', modulo: 'usuarios', registroId: id, detalle: `Reenvío a ${inv.email}` });
  revalidatePath('/usuarios/invitaciones');
  return { ok: true };
}

export async function cancelInvitationAction(id: string) {
  await requirePermission('usuarios.gestionar');
  const admin = createAdminClient();
  await admin.from('user_invitations').update({ status: 'cancelled' }).eq('id', id);
  await audit({ accion: 'cancelar_invitacion', modulo: 'usuarios', registroId: id });
  revalidatePath('/usuarios/invitaciones');
  return { ok: true };
}

export async function toggleUserActiveAction(id: string) {
  await requirePermission('usuarios.gestionar');
  const admin = createAdminClient();
  const { data: u } = await admin.from('profiles').select('activo').eq('id', id).single();
  if (!u) return { error: 'No encontrado' };
  await admin.from('profiles').update({ activo: !u.activo }).eq('id', id);
  await audit({
    accion: u.activo ? 'desactivar_usuario' : 'reactivar_usuario',
    modulo: 'usuarios', registroId: id,
    valorAnterior: { activo: u.activo }, valorNuevo: { activo: !u.activo },
  });
  revalidatePath('/usuarios');
  return { ok: true };
}

export async function updateUserRoleAction(formData: FormData) {
  await requirePermission('usuarios.gestionar');
  const id = String(formData.get('id') || '');
  const roleId = String(formData.get('roleId') || '');
  const admin = createAdminClient();
  const { data: prev } = await admin.from('profiles').select('role_id').eq('id', id).single();
  await admin.from('profiles').update({ role_id: roleId }).eq('id', id);
  await audit({
    accion: 'cambiar_rol', modulo: 'usuarios', registroId: id,
    valorAnterior: prev, valorNuevo: { role_id: roleId },
  });
  revalidatePath('/usuarios');
  return { ok: true };
}
