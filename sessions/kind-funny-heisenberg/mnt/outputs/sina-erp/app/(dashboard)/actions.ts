'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { audit } from '@/lib/auth/permissions';

export async function signOut() {
  await audit({ accion: 'logout', modulo: 'auth' });
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
