-- SINA ERP (Supabase ezzwcokjzbbbdadhnchw).
-- No aplicar esta migración a producción desde el agente. El PR solo deja el SQL.
--
-- Si un pedido se factura, el precio quedó aprobado (decisión del dueño).
-- Cuando pricing_status es pending_approval y estado_facturacion pasa a
-- facturado o facturado_parcial, se deja en approved y se escribe
-- pricing_audit_log igual que la aprobación manual de la app:
--   action discount_approved, entity_type sales_order,
--   old {"status":"pending_approval"},
--   new {"status":"approved","approver":<auth.uid()>}, user_id = ese usuario.
-- No rechaza la factura ni toca emitir_factura. Un error al auditar no
-- revierte la facturación. No cambia pedidos rejected ni normal, ni los que
-- siguen sin facturar.

create or replace function public.tg_price_approved_when_invoiced()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
begin
  if new.pricing_status is distinct from 'pending_approval'::public.pricing_status then
    return new;
  end if;
  if new.estado_facturacion is distinct from 'facturado'::public.ov_facturacion_status
     and new.estado_facturacion is distinct from 'facturado_parcial'::public.ov_facturacion_status then
    return new;
  end if;

  -- Antes de trg_sales_order_sync_estado, para que el piso de estado vea
  -- el precio ya aprobado en este mismo update.
  new.pricing_status := 'approved';

  begin
    insert into public.pricing_audit_log (
      entity_type, entity_id, action, old_value, new_value, user_id
    ) values (
      'sales_order',
      new.id,
      'discount_approved',
      jsonb_build_object('status', 'pending_approval'),
      jsonb_build_object('status', 'approved')
        || case when v_user is null then '{}'::jsonb
                else jsonb_build_object('approver', v_user) end,
      v_user
    );
  exception
    when others then
      raise notice 'aprobación por facturación no quedó en pricing_audit_log: %', sqlerrm;
  end;

  return new;
end;
$function$;

comment on function public.tg_price_approved_when_invoiced() is
  'Al facturar un pedido con precio pending_approval lo pasa a approved y lo anota en pricing_audit_log como discount_approved. No bloquea la facturación.';

revoke all on function public.tg_price_approved_when_invoiced() from public;
revoke all on function public.tg_price_approved_when_invoiced() from anon;
grant execute on function public.tg_price_approved_when_invoiced() to authenticated, service_role;

drop trigger if exists trg_price_approved_when_invoiced on public.sales_orders;
create trigger trg_price_approved_when_invoiced
  before insert or update of estado_facturacion, pricing_status
  on public.sales_orders
  for each row
  execute function public.tg_price_approved_when_invoiced();
