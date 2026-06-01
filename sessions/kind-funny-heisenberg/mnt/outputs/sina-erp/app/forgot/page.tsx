'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SinaLogo } from '@/components/brand/sina-logo';
import { Input } from '@/components/ui/input';
import { Btn } from '@/components/ui/button';
import { forgotAction } from './actions';

export default function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    await forgotAction(formData);
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sina-bg py-10 px-4">
      <div className="bg-white border border-sina-line rounded-lg p-8 w-full max-w-sm space-y-3">
        <SinaLogo size={36} />
        <h1 className="text-lg font-semibold text-sina-ink pt-2">Recuperar contraseña</h1>
        {!sent ? (
          <form action={onSubmit} className="space-y-3">
            <p className="text-sm text-sina-muted">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
            <Input label="Email" name="email" type="email" required autoFocus />
            <Btn type="submit" className="w-full" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</Btn>
            <Link href="/login" className="block text-center text-xs text-sina-navy font-medium">Volver al login</Link>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-sina-body">Si la dirección está registrada, enviamos un correo con instrucciones (válido por 1 hora).</p>
            <Link href="/login"><Btn variant="secondary" className="w-full">Volver al login</Btn></Link>
          </div>
        )}
      </div>
    </div>
  );
}
