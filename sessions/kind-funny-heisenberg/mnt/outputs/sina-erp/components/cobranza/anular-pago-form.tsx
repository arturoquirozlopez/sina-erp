'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { anularPagoFacturaAction, type AnularPagoState } from '@/app/(dashboard)/cobranza/actions';
import { Btn } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ConfirmarButton() {
  const { pending } = useFormStatus();
  return (
    <Btn type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? 'Anulando…' : 'Confirmar anulación'}
    </Btn>
  );
}

export function AnularPagoForm({
  paymentId,
  blockedReason,
}: {
  paymentId: string;
  blockedReason: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(anularPagoFacturaAction, {} as AnularPagoState);

  if (blockedReason) {
    return (
      <div className="text-left">
        <Btn type="button" variant="danger" size="sm" disabled title={blockedReason}>
          Anular pago
        </Btn>
        <p className="mt-1 text-xs text-sina-amber max-w-xs">{blockedReason}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <Btn type="button" variant="danger" size="sm" onClick={() => setOpen(true)}>
        Anular pago
      </Btn>
    );
  }

  return (
    <form action={action} className="space-y-2 text-left max-w-xs">
      <input type="hidden" name="payment_id" value={paymentId} />
      <p className="text-xs text-sina-body">
        ¿Anular este pago? Queda en el historial como rechazado y la factura vuelve a Pendiente o Parcial según el saldo.
      </p>
      <Input name="motivo" placeholder="Motivo (opcional)" maxLength={500} />
      {state?.error && <p className="text-xs text-sina-rose">{state.error}</p>}
      {state?.ok && (
        <p className="text-xs text-sina-mint">
          Pago anulado. La factura quedó {state.estado_pago === 'pagada' ? 'Pagada' : state.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}.
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <Btn type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Btn>
        <ConfirmarButton />
      </div>
    </form>
  );
}
