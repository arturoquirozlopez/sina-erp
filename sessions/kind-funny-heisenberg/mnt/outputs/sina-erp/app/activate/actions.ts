'use server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function activateAction(formData: FormData) {
  const token = String(formData.get('token') || '');
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName  = String(formData.get('lastName')  || '').trim();
  const telefono  = String(formData.get('telefono')  || '').trim();
  const password  = String(formData.get('password')  || '');
  const password2 = String(formData.get('password2') || '');

  if (!firstName || !lastName) return { error: 'Completa nombre y apellido' };
  if (password.length < 8)     return { error: 'La contraseña debe tener al menos 8 caracteres' };
  if (password !== password2)  return { error: 'Las contraseñas no coinciden' };

  const admin = createAdminClient();
  const { data: inv } = await admin.from('user_invitations').select('*').eq('invitation_token', token).maybeSingle();
  if (!inv) return { error: 'Token inválido' };
  if (inv.status === 'accepted')  return { error: 'Invitación ya utilizada' };
  if (inv.status === 'cancelled') return { error: 'Invitación cancelada' };
  if (new Date(inv.expires_at) < new Date()) return { error: 'Invitación expirada' };

  // Crear usuario en Supabase Auth
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: inv.email, password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role_id: inv.role_id },
  });
  if (createErr || !created.user) return { error: createErr?.message || 'No se pudo crear el usuario' };

  // Insertar en profiles
  await admin.from('profiles').insert({
    id: created.user.id, email: inv.email,
    nombre: firstName, apellido: lastName, telefono,
    cargo: inv.cargo, area: inv.area, role_id: inv.role_id,
    activo: true, activated_at: new Date().toISOString(),
    auth_providers: ['password'],
  });

  await admin.from('user_invitations').update({
    status: 'accepted', accepted_at: new Date().toISOString(), user_id: created.user.id,
  }).eq('id', inv.id);

  await admin.from('audit_log').insert({
    user_id: created.user.id, accion: 'activate_account', modulo: 'auth',
    detalle: 'Cuenta activada desde invitación',
  });

  redirect('/login?activated=1');
}
