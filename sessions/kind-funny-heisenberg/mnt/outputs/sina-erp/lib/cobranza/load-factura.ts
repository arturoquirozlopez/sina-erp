import { createClient } from '@/lib/supabase/server';
import { pagoRechazado, type PagoAnulable } from '@/lib/cobranza/anular-pago';

export type FacturaConPagos = {
  id: string;
  folio: number | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  neto: number;
  iva: number;
  total: number;
  estado_pago: string;
  estado_factura: string;
  cliente: { razon_social: string; rut: string } | null;
  pagos: PagoAnulable[];
};

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadFacturaConPagos(id: string): Promise<FacturaConPagos | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, folio, fecha_emision, fecha_vencimiento, neto, iva, total, estado_pago, estado_factura,
      client:clients(razon_social, rut),
      payments(id, fecha, monto, metodo, referencia, conciliado, bank_transaction_id, estado_validacion, origen)
    `)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;

  const pagos = await conVinculoBanco((data.payments ?? []) as PagoAnulable[]);
  return {
    id: data.id,
    folio: data.folio,
    fecha_emision: data.fecha_emision,
    fecha_vencimiento: data.fecha_vencimiento,
    neto: data.neto,
    iva: data.iva,
    total: data.total,
    estado_pago: data.estado_pago,
    estado_factura: data.estado_factura,
    cliente: asOne(data.client) as FacturaConPagos['cliente'],
    pagos,
  };
}

export async function conVinculoBanco(pagos: PagoAnulable[]): Promise<PagoAnulable[]> {
  const ordenados = [...pagos].sort((a, b) => {
    const ar = pagoRechazado(a) ? 1 : 0;
    const br = pagoRechazado(b) ? 1 : 0;
    if (ar !== br) return ar - br;
    return String(b.fecha).localeCompare(String(a.fecha));
  });
  if (ordenados.length === 0) return ordenados;

  const supabase = createClient();
  const { data } = await supabase
    .from('bank_transactions')
    .select('payment_id')
    .in('payment_id', ordenados.map(p => p.id));
  const linked = new Set((data ?? []).map((row: { payment_id: string | null }) => row.payment_id).filter(Boolean));
  return ordenados.map(pago => ({
    ...pago,
    vinculado_banco: linked.has(pago.id),
  }));
}
