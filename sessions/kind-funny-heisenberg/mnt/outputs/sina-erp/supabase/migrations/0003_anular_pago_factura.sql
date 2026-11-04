-- Anular un pago marcado por error.
-- No setear invoices.estado_pago a mano: el trigger suma los pagos que no
-- están en estado_validacion = 'rechazado' y recalcula el estado.
--
-- NO aplicar esta migración a producción. En sina-erp (Supabase) las columnas
-- estado_validacion / origen, recalc_invoice_payment_state y el trigger
-- trg_update_invoice_payment_state (INSERT/UPDATE/DELETE) ya existen y ya
-- ignoran los pagos rechazados. El archivo deja el scaffold local alineado
-- con esa base. Si se aplicara igual, el cuerpo de las funciones es el mismo
-- que producción y el trigger solo se recrea si todavía no escucha DELETE.

alter table public.payments
  add column if not exists estado_validacion text default 'validado';

alter table public.payments
  add column if not exists origen text default 'admin';

comment on column public.payments.estado_validacion is
  'validado (o null) cuenta para el saldo. rechazado anula el pago y conserva la fila.';

create or replace function public.recalc_invoice_payment_state(p_invoice_id uuid)
returns void
language plpgsql
set search_path to public
as $$
declare
  v_total numeric;
  v_paid numeric;
  v_estado public.factura_pago_estado;
begin
  select total into v_total from public.invoices where id = p_invoice_id;
  if not found then
    return;
  end if;

  select coalesce(sum(monto), 0) into v_paid
  from public.payments
  where invoice_id = p_invoice_id
    and coalesce(estado_validacion, 'validado') <> 'rechazado';

  v_estado := case
    when v_paid <= 0 then 'pendiente'::public.factura_pago_estado
    when v_paid + 10 >= v_total then 'pagada'::public.factura_pago_estado
    else 'parcial'::public.factura_pago_estado
  end;

  update public.invoices
     set estado_pago = v_estado
   where id = p_invoice_id
     and estado_pago is distinct from v_estado;
end;
$$;

create or replace function public.tg_update_invoice_payment_state()
returns trigger
language plpgsql
set search_path to public
as $$
declare
  v_id uuid;
begin
  v_id := coalesce(NEW.invoice_id, OLD.invoice_id);
  perform public.recalc_invoice_payment_state(v_id);
  return coalesce(NEW, OLD);
end;
$$;

do $$
declare
  v_def text;
begin
  select pg_get_triggerdef(t.oid) into v_def
  from pg_trigger t
  where t.tgname = 'trg_update_invoice_payment_state'
    and t.tgrelid = 'public.payments'::regclass
    and not t.tgisinternal;

  if v_def is null or position('DELETE' in v_def) = 0 then
    drop trigger if exists trg_update_invoice_payment_state on public.payments;
    create trigger trg_update_invoice_payment_state
      after insert or delete or update on public.payments
      for each row execute function public.tg_update_invoice_payment_state();
  end if;
end $$;
