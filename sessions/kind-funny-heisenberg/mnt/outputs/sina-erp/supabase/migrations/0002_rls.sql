-- =====================================================================================
-- ROW LEVEL SECURITY · Políticas por tabla
-- Patrón general: lectura para todos los autenticados; escritura según permisos
-- =====================================================================================

-- Helper: cualquier usuario autenticado
create or replace function public._is_auth() returns boolean language sql stable as $$ select auth.uid() is not null; $$;

-- Habilitar RLS
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename not in ('schema_migrations') loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Profiles: cada usuario lee a todos, edita solo el suyo (excepto admin/gestión)
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all to authenticated using (public.has_permission('usuarios.gestionar')) with check (public.has_permission('usuarios.gestionar'));

-- Roles
create policy roles_select on public.roles for select to authenticated using (true);
create policy roles_manage on public.roles for all to authenticated using (public.has_permission('usuarios.gestionar')) with check (public.has_permission('usuarios.gestionar'));

-- Invitaciones / resets / audit: solo admin
create policy invitations_admin on public.user_invitations for all to authenticated using (public.has_permission('usuarios.gestionar')) with check (public.has_permission('usuarios.gestionar'));
create policy password_resets_select on public.password_resets for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy audit_select on public.audit_log for select to authenticated using (public.has_permission('usuarios.gestionar'));
create policy audit_insert on public.audit_log for insert to authenticated with check (true);

-- Patrón genérico SELECT abierto · INSERT/UPDATE/DELETE por permiso
-- Clientes
create policy clients_select on public.clients for select to authenticated using (true);
create policy clients_insert on public.clients for insert to authenticated with check (public.has_permission('clientes.crear'));
create policy clients_update on public.clients for update to authenticated using (public.has_permission('clientes.editar'));
create policy clients_delete on public.clients for delete to authenticated using (public.has_permission('clientes.eliminar'));

create policy client_notes_select on public.client_notes for select to authenticated using (true);
create policy client_notes_write on public.client_notes for all to authenticated using (public.has_permission('clientes.editar')) with check (public.has_permission('clientes.editar'));

-- Productos
create policy products_select on public.products for select to authenticated using (true);
create policy products_insert on public.products for insert to authenticated with check (public.has_permission('inventario.crear'));
create policy products_update on public.products for update to authenticated using (public.has_permission('inventario.editar'));
create policy products_delete on public.products for delete to authenticated using (public.has_permission('inventario.eliminar'));

create policy inventory_stock_select on public.inventory_stock for select to authenticated using (true);
create policy inventory_stock_write on public.inventory_stock for all to authenticated using (public.has_permission('inventario.editar')) with check (public.has_permission('inventario.editar'));

create policy inv_mov_select on public.inventory_movements for select to authenticated using (true);
create policy inv_mov_insert on public.inventory_movements for insert to authenticated with check (public.has_permission('inventario.editar'));

create policy inv_transfers_select on public.inventory_transfers for select to authenticated using (true);
create policy inv_transfers_write  on public.inventory_transfers for all to authenticated using (public.has_permission('inventario.transferir')) with check (public.has_permission('inventario.transferir'));
create policy inv_transfer_items   on public.inventory_transfer_items for all to authenticated using (public.has_permission('inventario.transferir')) with check (public.has_permission('inventario.transferir'));

-- Proveedores
create policy suppliers_select on public.suppliers for select to authenticated using (true);
create policy suppliers_insert on public.suppliers for insert to authenticated with check (public.has_permission('proveedores.crear'));
create policy suppliers_update on public.suppliers for update to authenticated using (public.has_permission('proveedores.editar'));
create policy suppliers_delete on public.suppliers for delete to authenticated using (public.has_permission('proveedores.eliminar'));

-- Pickup points
create policy pp_select on public.pickup_points for select to authenticated using (true);
create policy pp_write  on public.pickup_points for all to authenticated using (public.has_permission('puntos_retiro.editar')) with check (public.has_permission('puntos_retiro.editar'));

-- Ventas
create policy quotes_select on public.quotes for select to authenticated using (true);
create policy quotes_insert on public.quotes for insert to authenticated with check (public.has_permission('cotizaciones.crear'));
create policy quotes_update on public.quotes for update to authenticated using (public.has_permission('cotizaciones.editar'));
create policy quotes_delete on public.quotes for delete to authenticated using (public.has_permission('cotizaciones.eliminar'));
create policy quote_items   on public.quote_items for all to authenticated using (public.has_permission('cotizaciones.editar')) with check (public.has_permission('cotizaciones.editar'));

create policy so_select on public.sales_orders for select to authenticated using (true);
create policy so_insert on public.sales_orders for insert to authenticated with check (public.has_permission('ventas.crear'));
create policy so_update on public.sales_orders for update to authenticated using (public.has_permission('ventas.editar'));
create policy so_delete on public.sales_orders for delete to authenticated using (public.has_permission('ventas.eliminar'));
create policy so_items on public.sales_order_items for all to authenticated using (public.has_permission('ventas.editar')) with check (public.has_permission('ventas.editar'));

-- Facturación
create policy inv_select on public.invoices for select to authenticated using (true);
create policy inv_write on public.invoices for all to authenticated using (public.has_permission('facturacion.emitir')) with check (public.has_permission('facturacion.emitir'));
create policy inv_items on public.invoice_items for all to authenticated using (public.has_permission('facturacion.emitir')) with check (public.has_permission('facturacion.emitir'));

create policy payments_select on public.payments for select to authenticated using (true);
create policy payments_write on public.payments for all to authenticated using (public.has_permission('cobranza.registrar_pago')) with check (public.has_permission('cobranza.registrar_pago'));

create policy bank_tx on public.bank_transactions for all to authenticated using (public.has_permission('cobranza.conciliar')) with check (public.has_permission('cobranza.conciliar'));
create policy collection_notes on public.collection_notes for all to authenticated using (public.has_permission('cobranza.ver')) with check (public.has_permission('cobranza.registrar_pago'));

-- Compras
create policy po_select on public.purchase_orders for select to authenticated using (true);
create policy po_insert on public.purchase_orders for insert to authenticated with check (public.has_permission('compras.crear'));
create policy po_update on public.purchase_orders for update to authenticated using (public.has_permission('compras.editar'));
create policy po_delete on public.purchase_orders for delete to authenticated using (public.has_permission('compras.eliminar'));
create policy po_items on public.purchase_order_items for all to authenticated using (public.has_permission('compras.editar')) with check (public.has_permission('compras.editar'));
create policy po_docs  on public.purchase_order_documents for all to authenticated using (public.has_permission('compras.editar')) with check (public.has_permission('compras.editar'));
create policy receptions on public.receptions for all to authenticated using (public.has_permission('compras.recibir')) with check (public.has_permission('compras.recibir'));
create policy reception_items on public.reception_items for all to authenticated using (public.has_permission('compras.recibir')) with check (public.has_permission('compras.recibir'));
create policy supplier_inv on public.supplier_invoices for all to authenticated using (public.has_permission('compras.ver')) with check (public.has_permission('compras.editar'));

-- Finanzas
create policy debts_select on public.debts for select to authenticated using (public.has_permission('deuda.ver'));
create policy debts_write on public.debts for all to authenticated using (public.has_permission('deuda.editar')) with check (public.has_permission('deuda.editar'));
create policy debt_payments on public.debt_payments for all to authenticated using (public.has_permission('deuda.ver')) with check (public.has_permission('deuda.editar'));

create policy expenses_select on public.operating_expenses for select to authenticated using (public.has_permission('finanzas.ver'));
create policy expenses_write on public.operating_expenses for all to authenticated using (public.has_permission('finanzas.editar')) with check (public.has_permission('finanzas.editar'));
create policy expense_cats on public.expense_categories for all to authenticated using (public.has_permission('finanzas.ver')) with check (public.has_permission('finanzas.editar'));
create policy fin_settings on public.financial_settings for all to authenticated using (public.has_permission('finanzas.ver')) with check (public.has_permission('finanzas.editar'));

-- Automatizaciones / aprobaciones / tareas
create policy automations on public.automations for all to authenticated using (public.has_permission('automatizaciones.ver')) with check (public.has_permission('automatizaciones.editar'));
create policy approval_rules on public.approval_rules for all to authenticated using (public.has_permission('config.gestionar')) with check (public.has_permission('config.gestionar'));
create policy tasks on public.tasks for all to authenticated using (true) with check (_is_auth());

-- WhatsApp
create policy wa_templates on public.message_templates for all to authenticated using (public.has_permission('mensajeria.ver')) with check (public.has_permission('mensajeria.responder'));
create policy wa_integ on public.messaging_integrations for all to authenticated using (public.has_permission('mensajeria.ver')) with check (public.has_permission('config.gestionar'));
create policy wa_conv on public.whatsapp_conversations for all to authenticated using (public.has_permission('mensajeria.ver')) with check (public.has_permission('mensajeria.responder'));
create policy wa_msg on public.whatsapp_messages for all to authenticated using (public.has_permission('mensajeria.ver')) with check (public.has_permission('mensajeria.responder'));
create policy wa_drafts on public.whatsapp_drafts for all to authenticated using (public.has_permission('mensajeria.ver')) with check (public.has_permission('mensajeria.responder'));
create policy wa_logs on public.ai_agent_logs for all to authenticated using (public.has_permission('mensajeria.ver')) with check (_is_auth());
create policy wa_handoffs on public.human_handoffs for all to authenticated using (public.has_permission('mensajeria.ver')) with check (public.has_permission('mensajeria.derivar'));

-- Email outbox (solo admin/sistema)
create policy email_outbox on public.email_outbox for select to authenticated using (public.is_admin());
