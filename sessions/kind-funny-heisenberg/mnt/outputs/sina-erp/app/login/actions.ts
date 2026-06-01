'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '/dashboard');

  if (!email || !password) return { error: 'Completa email y contraseña' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'Credenciales incorrectas' };

  // Audit + ultimo_login
  const admin = createAdminClient();
  await admin.from('profiles').update({ ultimo_login: new Date().toISOString() }).eq('id', data.user.id);
  await admin.from('audit_log').insert({ user_id: data.user.id, accion: 'login', modulo: 'auth', detalle: 'Inicio de sesión' });

  redirect(next);
}
