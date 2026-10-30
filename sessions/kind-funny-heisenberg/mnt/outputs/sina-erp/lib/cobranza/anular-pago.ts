/** Reglas de anulación de un pago de factura.
 *  El saldo no se escribe a mano: `recalc_invoice_payment_state` suma los pagos
 *  cuyo estado_validacion no es 'rechazado' y actualiza invoices.estado_pago.
 */

export type PagoAnulable = {
  id: string;
  fecha: string;
  monto: number | string;
  metodo: string;
  referencia: string | null;
  conciliado: boolean | null;
  bank_transaction_id: string | null;
  estado_validacion: string | null;
  origen?: string | null;
  /** Hay una bank_transactions.payment_id apuntando a este pago. */
  vinculado_banco?: boolean;
};

export function pagoRechazado(pago: { estado_validacion?: string | null }): boolean {
  return (pago.estado_validacion ?? 'validado') === 'rechazado';
}

export function pagoConciliado(pago: {
  conciliado?: boolean | null;
  bank_transaction_id?: string | null;
  vinculado_banco?: boolean;
}): boolean {
  return !!(pago.conciliado || pago.bank_transaction_id || pago.vinculado_banco);
}

/** null si el pago se puede anular. */
export function bloqueoAnulacion(pago: PagoAnulable): string | null {
  if (pagoRechazado(pago)) return 'Este pago ya está anulado.';
  if (pagoConciliado(pago)) {
    return 'Este pago está conciliado con el banco. Desconcilialo antes de anularlo.';
  }
  return null;
}

export function etiquetaEstadoPago(estado: string | null | undefined): string {
  if (estado === 'pagada') return 'Pagada';
  if (estado === 'parcial') return 'Parcial';
  return 'Pendiente';
}

export function sanearBusqueda(q: string): string {
  return q.replace(/[%_,()]/g, '').trim();
}

export function tonoEstadoPago(estado: string | null | undefined): 'mint' | 'amber' | 'sky' {
  if (estado === 'pagada') return 'mint';
  if (estado === 'parcial') return 'amber';
  return 'sky';
}
