-- SINA ERP (Supabase ezzwcokjzbbbdadhnchw).
-- No aplicar esta migración a producción desde el agente. El PR solo deja el SQL.
--
-- 1) Stock en tránsito
--    products.stock_en_transito solo lo restaban close_import_atomic y
--    close_import_v2. Nadie lo sumaba al crear o editar una importación, así
--    que la ficha del producto leía 0. v_stock_en_transito sí convierte los kg
--    de la línea a cajas (IMP-485959, in_transit, 8750 kg → 350 cajas).
--    La vista es security_invoker y imports/import_items exigen compras.ver:
--    Ventas no tiene ese permiso, así que leer la vista desde la ficha también
--    da 0. La cifra pública queda en la columna (products ya es legible) y la
--    vista deja de depender de compras.ver: solo expone producto y cajas.
--
-- 2) Cotización → pedido
--    El alta mobile no manda sales_orders.quote_id (las 10 filas que hoy lo
--    tienen son un enlace manual del 2026-11-02, no el flujo). El trigger
--    tg_quote_mark_converted solo corría en INSERT y como invoker, así que un
--    usuario sin cotizaciones.editar no marcaba la cotización aunque el pedido
--    trajera quote_id. Ahora corre también al actualizar quote_id y como
--    security definer. No toca emitir_factura ni pricing_status: un pedido con
--    precio pendiente de aprobación se sigue pudiendo facturar.

-- ---------------------------------------------------------------------------
-- Vista: el agregado de cajas no es el documento de la importación.
-- ---------------------------------------------------------------------------

alter view public.v_stock_en_transito set (security_invoker = false);

comment on view public.v_stock_en_transito is
  'Cajas en tránsito por producto. Los kg de import_items se convierten con el kg/caja de la línea. security_invoker = false para que Ventas (sin compras.ver) vea el mismo número que la ficha; no expone costos ni proveedor.';

create or replace function public.stock_en_transito_de(p_product_id uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce((
    select v.stock_en_transito
      from public.v_stock_en_transito v
     where v.product_id = p_product_id
  ), 0);
$function$;

comment on function public.stock_en_transito_de(uuid) is
  'Cajas en tránsito de un producto, leídas de v_stock_en_transito. Security definer para no depender de compras.ver.';

-- ---------------------------------------------------------------------------
-- La columna sigue a la vista. Un solo escritor.
-- ---------------------------------------------------------------------------

create or replace function public.refresh_stock_en_transito(p_product_ids uuid[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ids uuid[];
begin
  select coalesce(array_agg(distinct pid), '{}')
    into v_ids
    from unnest(coalesce(p_product_ids, '{}'::uuid[])) as pid
   where pid is not null;

  if cardinality(v_ids) = 0 then
    return;
  end if;

  -- Mismo orden de lock que close_import_v2 (SKU).
  perform 1
    from public.products p
   where p.id = any (v_ids)
   order by p.sku
     for update;

  update public.products p
     set stock_en_transito = coalesce(v.stock_en_transito, 0)
    from (
      select ids.product_id, tr.stock_en_transito
        from unnest(v_ids) as ids(product_id)
        left join public.v_stock_en_transito tr on tr.product_id = ids.product_id
    ) v
   where p.id = v.product_id
     and p.stock_en_transito is distinct from coalesce(v.stock_en_transito, 0);
end;
$function$;

comment on function public.refresh_stock_en_transito(uuid[]) is
  'Iguala products.stock_en_transito a v_stock_en_transito para esos productos. No inventa una cifra.';

-- Solo la ejecuta el trigger (security definer, dueño postgres). No es un RPC.
revoke all on function public.refresh_stock_en_transito(uuid[]) from public;
revoke all on function public.refresh_stock_en_transito(uuid[]) from anon;
revoke all on function public.refresh_stock_en_transito(uuid[]) from authenticated;
grant execute on function public.refresh_stock_en_transito(uuid[]) to service_role;

create or replace function public.tg_refresh_stock_en_transito()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ids uuid[];
begin
  if tg_table_name = 'import_items' then
    if tg_op = 'INSERT' then
      v_ids := array[new.product_id];
    elsif tg_op = 'DELETE' then
      v_ids := array[old.product_id];
    else
      v_ids := array[old.product_id, new.product_id];
    end if;
  else
    -- En DELETE de imports, ON DELETE CASCADE ya refrescó cada línea.
    if tg_op = 'DELETE' then
      return old;
    end if;
    select coalesce(array_agg(distinct ii.product_id), '{}')
      into v_ids
      from public.import_items ii
     where ii.import_id = new.id
       and ii.product_id is not null;
  end if;

  perform public.refresh_stock_en_transito(v_ids);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke all on function public.tg_refresh_stock_en_transito() from public;
revoke all on function public.tg_refresh_stock_en_transito() from anon;
grant execute on function public.tg_refresh_stock_en_transito() to authenticated, service_role;

drop trigger if exists tg_refresh_stock_en_transito_items on public.import_items;
create trigger tg_refresh_stock_en_transito_items
  after insert or delete or update of product_id, quantity, import_id on public.import_items
  for each row
  execute function public.tg_refresh_stock_en_transito();

drop trigger if exists tg_refresh_stock_en_transito_imports on public.imports;
create trigger tg_refresh_stock_en_transito_imports
  after update of status, kg_per_box_snapshot on public.imports
  for each row
  execute function public.tg_refresh_stock_en_transito();

comment on column public.products.stock_en_transito is
  'Cajas en tránsito. La mantiene tg_refresh_stock_en_transito desde v_stock_en_transito (kg de la línea convertidos a cajas). close_import ya no la resta a mano.';

-- El cierre deja de restar la columna. Al pasar status a closed la importación
-- sale de la vista y el trigger deja el total real. Restar acá descontaba dos
-- veces si el trigger ya había corrido, y no sumaba nada al entrar en tránsito.

create or replace function public.close_import_atomic(
  p_import_id uuid,
  p_user_id uuid,
  p_items_json jsonb,
  p_total_supplier_local numeric,
  p_total_additional_costs_local numeric,
  p_total_landed_cost_local numeric,
  p_allocation_method import_allocation_method,
  p_snapshot jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_item             jsonb;
  v_product_id       uuid;
  v_qty              int;
  v_unit_cost_local  numeric;
  v_prev_stock       int;
  v_prev_avg         numeric;
  v_new_stock        int;
  v_new_avg          numeric;
  v_status           import_estado;
begin
  select status into v_status from public.imports where id = p_import_id for update;
  if not found then raise exception 'Importación no encontrada'; end if;
  if v_status = 'closed' then raise exception 'La importación ya está cerrada'; end if;
  if v_status = 'cancelled' then raise exception 'La importación está cancelada'; end if;

  for v_item in select * from jsonb_array_elements(p_items_json) loop
    v_product_id      := (v_item->>'product_id')::uuid;
    v_qty             := (v_item->>'quantity')::int;
    v_unit_cost_local := (v_item->>'unit_landed_cost_local')::numeric;

    select
      coalesce(sum(s.cantidad), 0),
      coalesce(nullif(p.costo_promedio, 0), nullif(p.costo, 0), 0)
    into v_prev_stock, v_prev_avg
    from public.products p
    left join public.inventory_stock s on s.product_id = p.id
    where p.id = v_product_id
    group by p.id, p.costo_promedio, p.costo;

    if v_prev_stock is null then v_prev_stock := 0; end if;
    if v_prev_avg is null then v_prev_avg := v_unit_cost_local; end if;

    v_new_stock := v_prev_stock + v_qty;
    if v_new_stock = 0 then
      v_new_avg := v_unit_cost_local;
    else
      v_new_avg := round(
        ((v_prev_stock::numeric * v_prev_avg) + (v_qty::numeric * v_unit_cost_local))
        / v_new_stock::numeric
      , 4);
    end if;

    insert into public.inventory_movements(product_id, location_id, tipo, cantidad, costo_unit, motivo, user_id, reference)
      values (v_product_id, 'BC', 'entrada', v_qty, v_unit_cost_local,
              'Cierre importación ' || (select code from public.imports where id = p_import_id),
              p_user_id, p_import_id::text);

    update public.products set
      costo_promedio = v_new_avg,
      costo = v_new_avg,
      updated_at = now()
    where id = v_product_id;

    insert into public.product_cost_history(
      product_id, previous_stock, previous_average_cost,
      incoming_quantity, incoming_unit_cost,
      new_stock, new_average_cost,
      source_type, source_id, created_by
    ) values (
      v_product_id, v_prev_stock, v_prev_avg,
      v_qty, v_unit_cost_local,
      v_new_stock, v_new_avg,
      'import', p_import_id, p_user_id
    );

    update public.import_items set
      unit_landed_cost_local = v_unit_cost_local,
      total_landed_cost_local = (v_item->>'total_landed_cost_local')::numeric,
      allocated_additional_cost_local = (v_item->>'allocated_additional_cost_local')::numeric
    where id = (v_item->>'id')::uuid;
  end loop;

  update public.imports set
    status = 'closed',
    closed_at = now(),
    closed_by = p_user_id,
    total_supplier_local = p_total_supplier_local,
    total_additional_costs_local = p_total_additional_costs_local,
    total_landed_cost_local = p_total_landed_cost_local,
    allocation_method = p_allocation_method,
    calculation_snapshot = p_snapshot
  where id = p_import_id;
end;
$function$;

create or replace function public.close_import_v2(
  p_import_id uuid,
  p_user_id uuid,
  p_allocation_method import_allocation_method,
  p_kg_per_box jsonb,
  p_pending_supplier_usd numeric default 0,
  p_projection_exchange_rate numeric default null,
  p_exception_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_imp       record;
  v_paid_usd  numeric;
  v_pending   numeric := greatest(0, coalesce(p_pending_supplier_usd, 0));
  v_res       jsonb;
  r           record;
  v_prev_stk  numeric;
  v_prev_avg  numeric;
  v_new_avg   numeric;
  v_boxes     int := 0;
  v_user      uuid := coalesce(auth.uid(), p_user_id);
begin
  if auth.uid() is not null and not public.has_permission('compras.editar') then
    raise exception 'Sin permiso para cerrar importaciones';
  end if;

  select * into v_imp from public.imports where id = p_import_id for update;
  if not found then raise exception 'Importación no encontrada'; end if;
  if v_imp.status = 'closed'    then raise exception 'La importación ya está cerrada'; end if;
  if v_imp.status = 'cancelled' then raise exception 'La importación está cancelada'; end if;
  if not exists (select 1 from public.import_items where import_id = p_import_id) then
    raise exception 'La importación no tiene productos';
  end if;
  if v_pending > 0 and coalesce(p_projection_exchange_rate, 0) <= 0 then
    raise exception 'Falta el tipo de cambio de proyección para el saldo pendiente';
  end if;

  select coalesce(sum(amount_usd), 0) into v_paid_usd
    from public.import_payments where import_id = p_import_id;

  update public.imports set
    allocation_method        = p_allocation_method,
    kg_per_box_snapshot      = p_kg_per_box,
    pending_supplier_usd     = nullif(v_pending, 0),
    projection_exchange_rate = case when v_pending > 0 then p_projection_exchange_rate end,
    contracted_supplier_usd  = case when v_pending > 0 then v_paid_usd + v_pending end,
    exception_reason         = coalesce(nullif(p_exception_reason, ''), exception_reason)
  where id = p_import_id;

  v_res := public.recalc_import_costs(p_import_id, 'close', v_user);

  for r in
    select ipc.product_id, ipc.boxes, ipc.unit_cost_per_box, p.sku
      from public.import_product_costs ipc
      join public.products p on p.id = ipc.product_id
     where ipc.import_id = p_import_id and ipc.boxes > 0
     order by p.sku
     for update of p
  loop
    select coalesce(sum(s.cantidad), 0), coalesce(nullif(p.costo_promedio, 0), nullif(p.costo, 0), 0)
      into v_prev_stk, v_prev_avg
      from public.products p
      left join public.inventory_stock s on s.product_id = p.id
     where p.id = r.product_id
     group by p.id, p.costo_promedio, p.costo;

    if greatest(v_prev_stk, 0) + r.boxes > 0 then
      v_new_avg := round((greatest(v_prev_stk, 0) * v_prev_avg + r.boxes * r.unit_cost_per_box)
                         / (greatest(v_prev_stk, 0) + r.boxes), 2);
    else
      v_new_avg := round(r.unit_cost_per_box, 2);
    end if;

    insert into public.inventory_movements(product_id, location_id, tipo, cantidad, costo_unit, motivo, user_id, reference)
    values (r.product_id, 'BC', 'entrada', r.boxes, r.unit_cost_per_box,
            'Cierre importación ' || v_imp.code, v_user, p_import_id::text);

    update public.products set
      costo_promedio = v_new_avg,
      costo          = v_new_avg,
      updated_at     = now()
    where id = r.product_id;

    insert into public.product_cost_history(
      product_id, previous_stock, previous_average_cost, incoming_quantity, incoming_unit_cost,
      new_stock, new_average_cost, source_type, source_id, created_by)
    values (r.product_id, v_prev_stk::int, v_prev_avg, r.boxes, r.unit_cost_per_box,
            (v_prev_stk + r.boxes)::int, v_new_avg, 'import', p_import_id, v_user);

    update public.import_product_costs
       set applied_boxes = r.boxes, applied_unit_cost = r.unit_cost_per_box
     where import_id = p_import_id and product_id = r.product_id;

    v_boxes := v_boxes + r.boxes;
  end loop;

  if v_boxes = 0 then
    raise exception 'Ningún producto alcanza para armar al menos 1 caja con el kg/caja indicado';
  end if;

  update public.imports set
    status               = 'closed',
    closed_at            = now(),
    closed_by            = v_user,
    calculation_snapshot = public.compute_import_costs(p_import_id)
                           || jsonb_build_object('kind', 'v2', 'closed_at', now())
  where id = p_import_id;

  return v_res;
end;
$function$;

-- Alinea lo que ya está en tránsito (el backfill manual de hoy queda cubierto
-- y cualquier deriva posterior también).
select public.refresh_stock_en_transito(array(select id from public.products));

-- ---------------------------------------------------------------------------
-- quote_id marca la cotización, también si se graba después del insert.
-- ---------------------------------------------------------------------------

create or replace function public.tg_quote_mark_converted()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_op = 'UPDATE' and old.quote_id is not distinct from new.quote_id then
    return new;
  end if;

  -- Un quote_id corregido suelta la cotización anterior solo si apuntaba a este pedido.
  if tg_op = 'UPDATE'
     and old.quote_id is not null
     and old.quote_id is distinct from new.quote_id then
    begin
      update public.quotes
         set converted_to_order_id = null,
             converted_at = null
       where id = old.quote_id
         and converted_to_order_id = new.id;
    exception
      when insufficient_privilege then
        raise notice 'tg_quote_mark_converted omitido: %', sqlerrm;
    end;
  end if;

  if new.quote_id is not null then
    begin
      update public.quotes
         set converted_to_order_id = new.id,
             converted_at = coalesce(converted_at, now())
       where id = new.quote_id
         and (converted_to_order_id is null or converted_to_order_id = new.id);
    exception
      when insufficient_privilege then
        raise notice 'tg_quote_mark_converted omitido: %', sqlerrm;
    end;
  end if;

  return new;
end;
$function$;

comment on function public.tg_quote_mark_converted() is
  'Al guardar sales_orders.quote_id (insert o update) marca la cotización con converted_to_order_id. Security definer: no depende de cotizaciones.editar. No cambia el estado de la cotización ni bloquea la facturación.';

drop trigger if exists tg_quote_mark_converted on public.sales_orders;
create trigger tg_quote_mark_converted
  after insert or update of quote_id on public.sales_orders
  for each row
  execute function public.tg_quote_mark_converted();
