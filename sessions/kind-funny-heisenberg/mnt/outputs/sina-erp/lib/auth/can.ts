import type { Permission, ProfileWithRole } from '@/lib/types';

/** Chequea sin redirigir. Admin siempre true. Seguro de importar desde el cliente. */
export function can(profile: ProfileWithRole | null, perm: Permission): boolean {
  if (!profile) return false;
  if (profile.role?.nombre === 'Administrador') return true;
  const ov = profile.permisos_override?.[perm];
  if (ov != null) return ov;
  return !!profile.role?.permisos?.[perm];
}
