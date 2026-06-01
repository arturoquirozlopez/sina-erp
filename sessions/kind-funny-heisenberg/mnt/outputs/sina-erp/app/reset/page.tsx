import { resetAction } from './actions';
import { SinaLogo } from '@/components/brand/sina-logo';
import { Input } from '@/components/ui/input';
import { Btn } from '@/components/ui/button';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export default async function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  if (!token) return <Centered title="Token no provisto" />;

  const admin = createAdminClient();
  const { data: reset } = await admin.from('password_resets').select('id, used, expires_at, user_id').eq('token', token).maybeSingle();

  if (!reset || reset.used) return <Centered title="Enlace inválido o ya utilizado" />;
  if (new Date(reset.expires_at) < new Date()) return <Centered title="Enlace expirado" message="Solicita un nuevo enlace de recuperación." cta={{ href: '/forgot', label: 'Solicitar nuevo enlace' }} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-sina-bg py-10 px-4">
      <form action={async (fd) => { 'use server'; await resetAction(fd); }} className="bg-white border border-sina-line rounded-lg p-8 w-full max-w-sm space-y-3">
        <SinaLogo size={36} />
        <h1 className="text-lg font-semibold text-sina-ink pt-2">Nueva contraseña</h1>
        <input type="hidden" name="token" value={token} />
        <Input label="Nueva contraseña" name="password" type="password" required hint="Mínimo 8 caracteres" />
        <Input label="Confirmar contraseña" name="password2" type="password" required />
        <Btn type="submit" className="w-full">Restablecer contraseña</Btn>
      </form>
    </div>
  );
}

function Centered({ title, message, cta }: { title: string; message?: string; cta?: { href: string; label: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sina-bg py-10 px-4">
      <div className="bg-white border border-sina-line rounded-lg p-8 max-w-sm w-full text-center space-y-3">
        <SinaLogo size={36} />
        <h1 className="text-lg font-semibold text-sina-rose">{title}</h1>
        {message && <p className="text-sm text-sina-muted">{message}</p>}
        {cta && <Link href={cta.href}><Btn className="w-full">{cta.label}</Btn></Link>}
      </div>
    </div>
  );
}
