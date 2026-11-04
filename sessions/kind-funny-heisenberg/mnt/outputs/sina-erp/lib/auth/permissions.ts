import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Permission, ProfileWithRole } from '@/lib/types';
import { can } from '@/lib/auth/can';

export { can };

/** Devuelve el perfil del usuario autenticado (con su rol) o null. */
export async function getCurrentProfile(): Promise<ProfileWithRole | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, email, nombre, apellido, telefono, cargo, area, role_id, activo, ultimo_login, permisos_override, role:roles(id, nombre, permisos)')
    .eq('id', user.id)
    .single();
  return data as any as ProfileWithRole | null;
}

/** Lanza redirect si el usuario no tiene permiso. */
export async function requirePermission(perm: Permission) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (!can(profile, perm)) redirect('/dashboard?error=forbidden');
  return profile;
}

/** Registra entrada de auditoría. */
export async function audit({
  accion, modulo, registroId, registroTipo, valorAnterior, valorNuevo, detalle,
}: {
  accion: string; modulo?: string; registroId?: string; registroTipo?: string;
  valorAnterior?: any; valorNuevo?: any; detalle?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('audit_log').insert({
    user_id: user?.id ?? null,
    accion, modulo, registro_id: registroId, registro_tipo: registroTipo,
    valor_anterior: valorAnterior ?? null,
    valor_nuevo: valorNuevo ?? null,
    detalle,
  });
}
