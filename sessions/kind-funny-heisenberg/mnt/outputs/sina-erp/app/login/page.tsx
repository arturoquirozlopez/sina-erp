import { loginAction } from './actions';
import { SinaLogo } from '@/components/brand/sina-logo';
import { Input } from '@/components/ui/input';
import { Btn } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sina-bg py-10 px-4">
      <form action={async (fd) => { 'use server'; await loginAction(fd); }} className="bg-white border border-sina-line rounded-lg p-8 w-full max-w-sm space-y-3">
        <SinaLogo size={40} />
        <h1 className="text-lg font-semibold text-sina-ink pt-2">Ingresar a Sina ERP</h1>
        <Input label="Email" name="email" type="email" required autoFocus />
        <Input label="Contraseña" name="password" type="password" required />
        <input type="hidden" name="next" value={searchParams.next || '/dashboard'} />
        {searchParams.error && <div className="text-xs text-sina-rose">Credenciales inválidas o cuenta inactiva</div>}
        <div className="flex justify-end">
          <Link href="/forgot" className="text-xs text-sina-navy font-medium">¿Olvidaste tu contraseña?</Link>
        </div>
        <Btn type="submit" className="w-full">Ingresar</Btn>
      </form>
    </div>
  );
}
