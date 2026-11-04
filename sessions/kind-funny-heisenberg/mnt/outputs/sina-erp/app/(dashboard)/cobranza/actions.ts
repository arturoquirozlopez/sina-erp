'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission, audit } from '@/lib/auth/permissions';
import { CLP, fmtDate } from '@/lib/format';
import { bloqueoAnulacion, type PagoAnulable } from '@/lib/cobranza/anular-pago';

export type AnularPagoState = {
  error?: string;
  ok?: boolean;
  estado_pago?: string;
};

const AnularSchema = z.object({
  payment_id: z.string().uuid('Pago inválido'),
  motivo: z.string().trim().max(500, 'El motivo no puede superar 500 caracteres').optional(),
});

/** Marca el pago como rechazado. El trigger recalcula invoices.estado_pago. */
export async function anularPagoFacturaAction(
  _prev: AnularPagoState,
  formData: FormData,
): Promise<AnularPagoState> {
  await requirePermission('cobranza.registrar_pago');

  const motivoRaw = String(formData.get('motivo') ?? '').trim();
  const parsed = AnularSchema.safeParse({
    payment_id: String(formData.get('payment_id') ?? ''),
    motivo: motivoRaw || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { payment_id: paymentId, motivo } = parsed.data;
  const supabase = createClient();

  const { data: pago, error: readError } = await supabase
    .from('payments')
    .select('id, invoice_id, fecha, monto, metodo, referencia, conciliado, bank_transaction_id, estado_validacion, origen, user_id, created_at')
    .eq('id', paymentId)
    .maybeSingle();
  if (readError) return { error: readError.message };
  if (!pago) return { error: 'Pago no encontrado.' };

  const { data: vinculo, error: vinculoError } = await supabase
    .from('bank_transactions')
    .select('id')
    .eq('payment_id', paymentId)
    .limit(1)
    .maybeSingle();
  if (vinculoError) return { error: vinculoError.message };

  const pagoVista: PagoAnulable = {
    ...pago,
    vinculado_banco: !!vinculo,
  };
  const bloqueo = bloqueoAnulacion(pagoVista);
  if (bloqueo) return { error: bloqueo };

  const update = supabase
    .from('payments')
    .update({ estado_validacion: 'rechazado' })
    .eq('id', paymentId)
    .eq('conciliado', false)
    .is('bank_transaction_id', null);
  const filtered = pago.estado_validacion
    ? update.eq('estado_validacion', pago.estado_validacion)
    : update.is('estado_validacion', null);
  const { data: updated, error: updateError } = await filtered
    .select('id')
    .maybeSingle();
  if (updateError) return { error: updateError.message };
  if (!updated) {
    return { error: 'No se pudo anular el pago. Puede estar conciliado o ya anulado.' };
  }

  const { data: factura } = await supabase
    .from('invoices')
    .select('id, folio, estado_pago, total, client:clients(razon_social)')
    .eq('id', pago.invoice_id)
    .maybeSingle();

  const cliente = Array.isArray(factura?.client) ? factura?.client[0] : factura?.client;
  const detalle = [
    factura?.folio != null ? `Folio ${factura.folio}` : null,
    cliente?.razon_social ?? null,
    `pago ${CLP(Number(pago.monto))} ${pago.metodo} del ${fmtDate(pago.fecha)} anulado`,
    motivo ? `Motivo: ${motivo}` : null,
  ].filter(Boolean).join(' · ');

  await audit({
    accion: 'anular_pago_factura',
    modulo: 'cobranza',
    registroId: paymentId,
    registroTipo: 'payment',
    valorAnterior: pago,
    valorNuevo: {
      estado_validacion: 'rechazado',
      motivo: motivo ?? null,
      invoice_id: pago.invoice_id,
      estado_pago: factura?.estado_pago ?? null,
    },
    detalle,
  });

  revalidatePath('/cobranza');
  revalidatePath(`/cobranza/${pago.invoice_id}`);
  revalidatePath('/facturacion');
  revalidatePath(`/facturacion/${pago.invoice_id}`);

  return { ok: true, estado_pago: factura?.estado_pago ?? undefined };
}
