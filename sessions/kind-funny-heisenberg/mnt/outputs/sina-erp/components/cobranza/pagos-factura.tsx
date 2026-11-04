import { CLP, fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { AnularPagoForm } from '@/components/cobranza/anular-pago-form';
import { bloqueoAnulacion, pagoRechazado, type PagoAnulable } from '@/lib/cobranza/anular-pago';

export function PagosFactura({
  pagos,
  canAnular,
}: {
  pagos: PagoAnulable[];
  canAnular: boolean;
}) {
  if (pagos.length === 0) {
    return <p className="text-sm text-sina-muted">Sin pagos registrados.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wider text-sina-muted border-b border-sina-line">
          <th className="pb-2 font-medium">Fecha</th>
          <th className="pb-2 font-medium">Método</th>
          <th className="pb-2 font-medium">Referencia</th>
          <th className="pb-2 font-medium">Origen</th>
          <th className="pb-2 font-medium text-right">Monto</th>
          <th className="pb-2 font-medium">Estado</th>
          <th className="pb-2 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {pagos.map(pago => {
          const anulado = pagoRechazado(pago);
          const bloqueo = bloqueoAnulacion(pago);
          return (
            <tr key={pago.id} className="border-b border-sina-lineSoft align-top">
              <td className="py-2">{fmtDate(pago.fecha)}</td>
              <td>{pago.metodo}</td>
              <td className="font-mono text-xs">{pago.referencia || '—'}</td>
              <td className="text-xs text-sina-muted">{pago.origen || 'admin'}</td>
              <td className={`py-2 text-right num ${anulado ? 'line-through text-sina-muted' : ''}`}>{CLP(Number(pago.monto))}</td>
              <td>
                {anulado
                  ? <Badge tone="rose">Anulado</Badge>
                  : pago.conciliado || pago.bank_transaction_id || pago.vinculado_banco
                    ? <Badge tone="amber">Conciliado</Badge>
                    : <Badge tone="mint">Validado</Badge>}
              </td>
              <td className="py-2 text-right">
                {canAnular && !anulado && (
                  <AnularPagoForm paymentId={pago.id} blockedReason={bloqueo} />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
