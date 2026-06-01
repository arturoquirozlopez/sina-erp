'use server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken } from '@/lib/auth/tokens';
import { sendEmail } from '@/lib/email';
import { buildPasswordResetEmail } from '@/lib/email/templates';

export async function forgotAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email) return { ok: false };

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('id, email, nombre').eq('email', email).eq('activo', true).maybeSingle();

  if (profile) {
    const token = generateSecureToken();
    await admin.from('password_resets').insert({
      user_id: profile.id, token,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
    await sendEmail(buildPasswordResetEmail({ to: profile.email, firstName: profile.nombre, token }), 'password_reset');
    await admin.from('audit_log').insert({ user_id: profile.id, accion: 'solicitar_reset', modulo: 'auth', detalle: 'Solicitud de reset' });
  }
  // No revelar si el email existe — siempre retorna ok
  return { ok: true };
}
