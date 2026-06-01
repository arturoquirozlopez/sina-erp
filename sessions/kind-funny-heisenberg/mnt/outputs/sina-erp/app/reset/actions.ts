'use server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function resetAction(formData: FormData) {
  const token = String(formData.get('token') || '');
  const password = String(formData.get('password') || '');
  const password2 = String(formData.get('password2') || '');

  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' };
  if (password !== password2) return { error: 'Las contraseñas no coinciden' };

  const admin = createAdminClient();
  const { data: reset } = await admin.from('password_resets').select('*').eq('token', token).eq('used', false).maybeSingle();
  if (!reset) return { error: 'Enlace inválido o ya utilizado' };
  if (new Date(reset.expires_at) < new Date()) return { error: 'Enlace expirado' };

  // Cambiar contraseña vía admin API
  const { error } = await admin.auth.admin.updateUserById(reset.user_id, { password });
  if (error) return { error: error.message };

  await admin.from('password_resets').update({ used: true, used_at: new Date().toISOString() }).eq('id', reset.id);
  await admin.from('audit_log').insert({ user_id: reset.user_id, accion: 'reset_password', modulo: 'auth', detalle: 'Contraseña restablecida' });

  redirect('/login?reset=ok');
}
