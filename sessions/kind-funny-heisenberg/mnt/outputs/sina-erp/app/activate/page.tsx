import { activateAction } from './actions';
import { SinaLogo } from '@/components/brand/sina-logo';
import { Input } from '@/components/ui/input';
import { Btn } from '@/components/ui/button';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function ActivatePage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  if (!token) return <Centered title="Token no provisto" />;

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from('user_invitations')
    .select('email, first_name, last_name, status, expires_at, cargo, area, role_id, role:roles(nombre)')
    .eq('invitation_token', token)
    .maybeSingle();

  if (!inv) return <Centered title="Token inválido" />;
  if (inv.status === 'accepted')  return <Centered title="Invitación ya utilizada" message="Esta invitación ya fue activada." />;
  if (inv.status === 'cancelled') return <Centered title="Invitación cancelada" />;
  if (new Date(inv.expires_at) < new Date()) return <Centered title="Invitación expirada" message="Pide al administrador que reenvíe la invitación." />;

  const roleName = (inv.role as any)?.nombre || '—';

  return (
    <div className="min-h-screen flex items-center justify-center bg-sina-bg py-10 px-4">
      <form action={async (fd) => { 'use server'; await activateAction(fd); }} className="bg-white border border-sina-line rounded-lg p-8 w-full max-w-md space-y-3">
        <SinaLogo size={36} />
        <h1 className="text-lg font-semibold text-sina-ink pt-2">Activa tu cuenta</h1>
        <p className="text-sm text-sina-muted">Fuiste invitado con el rol <b className="text-sina-navy">{roleName}</b>.</p>
        <input type="hidden" name="token" value={token} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre"   name="firstName" defaultValue={inv.first_name} required />
          <Input label="Apellido" name="lastName"  defaultValue={inv.last_name}  required />
        </div>
        <Input label="Email" defaultValue={inv.email} disabled />
        <Input label="Teléfono (opcional)" name="telefono" />
        <Input label="Contraseña" name="password" type="password" required hint="Mínimo 8 caracteres" />
        <Input label="Confirmar contraseña" name="password2" type="password" required />
        <Btn type="submit" className="w-full">Activar cuenta</Btn>
      </form>
    </div>
  );
}

function Centered({ title, message }: { title: string; message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sina-bg py-10 px-4">
      <div className="bg-white border border-sina-line rounded-lg p-8 max-w-sm w-full text-center space-y-3">
        <SinaLogo size={36} />
        <h1 className="text-lg font-semibold text-sina-rose">{title}</h1>
        {message && <p className="text-sm text-sina-muted">{message}</p>}
      </div>
    </div>
  );
}
