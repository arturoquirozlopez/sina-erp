-- =====================================================================================
-- SINA ERP · MIGRACIÓN INICIAL · v1.0.0
-- Schema completo para producción (Postgres / Supabase)
-- =====================================================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========================================
-- ENUMs
-- =========================================
create type producto_stock_estado  as enum ('saludable','bajo','riesgo','sin_stock');
create type movimiento_tipo        as enum ('entrada','salida','ajuste','transferencia');
create type cliente_segmento       as enum ('constructora','ferreteria','pintor','retail','industria','inmobiliaria','mayorista');
create type cliente_estado         as enum ('activo','inactivo','riesgo_fuga','perdido');
create type cotizacion_estado      as enum ('borrador','enviada','aprobada','rechazada','expirada');
create type ov_estado              as enum ('pendiente','confirmada','entregada','facturada','pagada');
create type ov_tipo_entrega        as enum ('despacho','retiro');
create type ov_estado_retiro       as enum ('pendiente_preparacion','listo_para_retiro','retirado','no_retirado');
create type factura_estado         as enum ('borrador','emitida','anulada');
create type factura_pago_estado    as enum ('pendiente','parcial','pagada');
create type oc_estado              as enum ('borrador','enviada','confirmada','en_produccion','en_transito','llegada','recepcion_parcial','recibida');
create type debt_tipo              as enum ('prestamo_bancario','linea_credito','leasing','credito_proveedor','otro');
create type debt_estado            as enum ('activa','pagada','refinanciada','vencida');
create type debt_tipo_tasa         as enum ('fija','variable');
create type proveedor_factura_estado as enum ('pendiente','parcial','pagada','vencida');
create type invitation_status      as enum ('pending','accepted','expired','cancelled');
create type pickup_point_tipo      as enum ('bodega','punto');
create type pickup_point_estado    as enum ('activo','inactivo');
create type expense_tipo           as enum ('sga','financiero','otro');
create type ai_handoff_motivo      as enum ('pidio_humano','reclamo','descuento_solicitado','sin_stock','facturas_vencidas','monto_alto','intentos_fallidos','producto_ambiguo','manual');
create type wa_conv_estado         as enum ('nuevo','en_conversacion','esperando_info','pendiente_aprobacion','orden_creada','derivado','cerrado');
create type automation_canal       as enum ('email','whatsapp','notif','tarea');

-- =========================================
-- USUARIOS · extiende auth.users de Supabase
-- =========================================
create table public.roles (
  id          text primary key,
  nombre      text unique not null,
  descripcion text,
  sistema     boolean not null default false,
  permisos    jsonb   not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  email           text unique not null,
  nombre          text not null,
  apellido        text not null,
  telefono        text,
  cargo           text,
  area            text,
  role_id         text not null references public.roles(id),
  activo          boolean not null default true,
  ultimo_login    timestamptz,
  activated_at    timestamptz,
  permisos_override jsonb not null default '{}'::jsonb,
  auth_providers  text[] not null default array['password'],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index profiles_email_idx on public.profiles(email);
create index profiles_role_idx  on public.profiles(role_id);

create table public.user_invitations (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  first_name    text not null,
  last_name     text not null,
  cargo         text,
  area          text,
  role_id       text not null references public.roles(id),
  invited_by    uuid references public.profiles(id),
  invitation_token text unique not null,
  status        invitation_status not null default 'pending',
  expires_at    timestamptz not null,
  accepted_at   timestamptz,
  last_resent_at timestamptz,
  user_id       uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
create unique index user_invitations_email_pending_idx on public.user_invitations(lower(email)) where status='pending';
create index user_invitations_token_idx on public.user_invitations(invitation_token);

create table public.password_resets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token       text unique not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index password_resets_token_idx on public.password_resets(token);

-- =========================================
-- AUDITORÍA
-- =========================================
create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id),
  accion      text not null,
  modulo      text,
  registro_id text,
  registro_tipo text,
  valor_anterior jsonb,
  valor_nuevo  jsonb,
  detalle     text,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index audit_log_user_idx on public.audit_log(user_id, created_at desc);
create index audit_log_modulo_idx on public.audit_log(modulo, created_at desc);

-- =========================================
-- PROVEEDORES
-- =========================================
create table public.suppliers (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  pais        text not null,
  contacto    text,
  email       text,
  telefono    text,
  direccion   text,
  ciudad      text,
  codigo_postal text,
  tiempo_produccion_dias int not null default 30,
  tiempo_transito_dias   int not null default 0,
  lead_time_dias         int not null default 30,
  moneda      text not null default 'CLP',
  banca       jsonb not null default '{}'::jsonb,
  notas       text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index suppliers_pais_idx on public.suppliers(pais);

-- =========================================
-- PUNTOS DE RETIRO Y BODEGAS
-- =========================================
create table public.pickup_points (
  id           text primary key,
  nombre       text not null,
  tipo         pickup_point_tipo not null default 'punto',
  direccion    text,
  comuna       text,
  ciudad       text,
  responsable  text,
  telefono     text,
  email        text,
  horario      text,
  estado       pickup_point_estado not null default 'activo',
  created_at   timestamptz not null default now()
);

-- =========================================
-- PRODUCTOS
-- =========================================
create table public.products (
  id           uuid primary key default uuid_generate_v4(),
  sku          text unique not null,
  nombre       text not null,
  categoria    text not null,
  acabado      text,
  color        text,
  formato      text,
  descripcion  text,
  proveedor_id uuid references public.suppliers(id) on delete set null,
  costo        numeric(12,2) not null default 0,
  precio       numeric(12,2) not null default 0,
  stock_min    int not null default 0,
  stock_reco   int not null default 0,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index products_categoria_idx on public.products(categoria);
create index products_proveedor_idx on public.products(proveedor_id);
create index products_activo_idx on public.products(activo);

-- Stock por ubicación
create table public.inventory_stock (
  product_id     uuid not null references public.products(id) on delete cascade,
  location_id    text not null references public.pickup_points(id) on delete cascade,
  cantidad       int not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (product_id, location_id)
);

-- Movimientos de inventario
create table public.inventory_movements (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  location_id text references public.pickup_points(id),
  tipo        movimiento_tipo not null,
  cantidad    int not null check (cantidad >= 0),
  motivo      text,
  costo_unit  numeric(12,2),
  user_id     uuid references public.profiles(id),
  fecha       date not null default current_date,
  reference   text,
  created_at  timestamptz not null default now()
);
create index inventory_movements_product_idx on public.inventory_movements(product_id, fecha desc);

-- Trigger: aplicar movimiento a inventory_stock
create or replace function public.tg_apply_inventory_movement() returns trigger language plpgsql as $$
begin
  if NEW.tipo='entrada' then
    insert into public.inventory_stock(product_id, location_id, cantidad)
      values (NEW.product_id, coalesce(NEW.location_id,'BC'), NEW.cantidad)
      on conflict (product_id, location_id) do update set cantidad = public.inventory_stock.cantidad + NEW.cantidad, updated_at = now();
  elsif NEW.tipo='salida' then
    insert into public.inventory_stock(product_id, location_id, cantidad)
      values (NEW.product_id, coalesce(NEW.location_id,'BC'), 0)
      on conflict (product_id, location_id) do update set cantidad = greatest(0, public.inventory_stock.cantidad - NEW.cantidad), updated_at = now();
  elsif NEW.tipo='ajuste' then
    insert into public.inventory_stock(product_id, location_id, cantidad)
      values (NEW.product_id, coalesce(NEW.location_id,'BC'), NEW.cantidad)
      on conflict (product_id, location_id) do update set cantidad = NEW.cantidad, updated_at = now();
  end if;
  return NEW;
end; $$;
create trigger trg_apply_inv_movement after insert on public.inventory_movements
  for each row execute function public.tg_apply_inventory_movement();

-- Transferencias entre ubicaciones
create table public.inventory_transfers (
  id          uuid primary key default uuid_generate_v4(),
  origen_id   text not null references public.pickup_points(id),
  destino_id  text not null references public.pickup_points(id),
  fecha       date not null default current_date,
  user_id     uuid references public.profiles(id),
  estado      text not null default 'borrador' check (estado in ('borrador','en_transito','recibida')),
  observaciones text,
  created_at  timestamptz not null default now()
);
create table public.inventory_transfer_items (
  id            uuid primary key default uuid_generate_v4(),
  transfer_id   uuid not null references public.inventory_transfers(id) on delete cascade,
  product_id    uuid not null references public.products(id),
  cantidad      int not null check (cantidad > 0)
);

-- =========================================
-- CLIENTES (CRM)
-- =========================================
create table public.clients (
  id          uuid primary key default uuid_generate_v4(),
  razon_social text not null,
  contacto    text,
  rut         text unique not null,
  email       text,
  telefono    text,
  direccion   text,
  comuna      text,
  ciudad      text,
  segmento    cliente_segmento not null default 'retail',
  ejecutivo_id uuid references public.profiles(id) on delete set null,
  notas       text,
  estado      cliente_estado not null default 'activo',
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index clients_segmento_idx on public.clients(segmento);
create index clients_ejecutivo_idx on public.clients(ejecutivo_id);
create index clients_rut_idx on public.clients(rut);

create table public.client_notes (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  user_id     uuid references public.profiles(id),
  tipo        text not null check (tipo in ('Llamada','Visita','Email','WhatsApp','Reunion')),
  nota        text not null,
  fecha       date not null default current_date,
  created_at  timestamptz not null default now()
);

-- =========================================
-- COTIZACIONES Y ORDENES DE VENTA
-- =========================================
create table public.quotes (
  id          uuid primary key default uuid_generate_v4(),
  numero      text unique not null,
  client_id   uuid not null references public.clients(id),
  vendedor_id uuid references public.profiles(id),
  fecha       date not null default current_date,
  vence       date not null default (current_date + interval '15 days'),
  estado      cotizacion_estado not null default 'borrador',
  neto        numeric(12,2) not null default 0,
  iva         numeric(12,2) not null default 0,
  total       numeric(12,2) not null default 0,
  descuento_global jsonb,
  observaciones text,
  condiciones text,
  pdf_url     text,
  envios      jsonb default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.quote_items (
  id            uuid primary key default uuid_generate_v4(),
  quote_id      uuid not null references public.quotes(id) on delete cascade,
  product_id    uuid not null references public.products(id),
  cantidad      int not null,
  precio        numeric(12,2) not null,
  descuento_tipo text not null default '%' check (descuento_tipo in ('%','$')),
  descuento_valor numeric(12,2) not null default 0,
  total         numeric(12,2) not null,
  costo_snapshot numeric(12,2) not null
);
create index quote_items_quote_idx on public.quote_items(quote_id);

create table public.sales_orders (
  id          uuid primary key default uuid_generate_v4(),
  numero      text unique not null,
  client_id   uuid not null references public.clients(id),
  vendedor_id uuid references public.profiles(id),
  quote_id    uuid references public.quotes(id) on delete set null,
  fecha       date not null default current_date,
  estado      ov_estado not null default 'pendiente',
  tipo_entrega ov_tipo_entrega not null default 'despacho',
  pickup_point_id text references public.pickup_points(id),
  estado_retiro ov_estado_retiro,
  origen      text default 'manual',
  whatsapp_conversation_id uuid,
  neto        numeric(12,2) not null default 0,
  iva         numeric(12,2) not null default 0,
  total       numeric(12,2) not null default 0,
  descuento_global jsonb,
  observaciones text,
  historial_estados jsonb default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index sales_orders_client_idx on public.sales_orders(client_id);
create index sales_orders_estado_idx on public.sales_orders(estado);

create table public.sales_order_items (
  id            uuid primary key default uuid_generate_v4(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id    uuid not null references public.products(id),
  cantidad      int not null,
  precio        numeric(12,2) not null,
  descuento_tipo text not null default '%',
  descuento_valor numeric(12,2) not null default 0,
  total         numeric(12,2) not null,
  costo_snapshot numeric(12,2) not null
);

-- =========================================
-- FACTURACIÓN ELECTRÓNICA
-- =========================================
create table public.invoices (
  id           uuid primary key default uuid_generate_v4(),
  folio        bigint unique,
  sales_order_id uuid references public.sales_orders(id) on delete set null,
  client_id    uuid not null references public.clients(id),
  fecha_emision date not null default current_date,
  fecha_vencimiento date not null,
  neto         numeric(12,2) not null,
  iva          numeric(12,2) not null,
  total        numeric(12,2) not null,
  estado_factura factura_estado not null default 'borrador',
  estado_pago  factura_pago_estado not null default 'pendiente',
  provider_name text,
  provider_folio text,
  provider_track_id text,
  provider_response jsonb,
  pdf_url      text,
  xml          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index invoices_client_idx on public.invoices(client_id);
create index invoices_estado_pago_idx on public.invoices(estado_pago);

create table public.invoice_items (
  id           uuid primary key default uuid_generate_v4(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  product_id   uuid not null references public.products(id),
  cantidad     int not null,
  precio       numeric(12,2) not null,
  descuento_tipo text not null default '%',
  descuento_valor numeric(12,2) not null default 0,
  total        numeric(12,2) not null,
  costo_snapshot numeric(12,2) not null
);

create table public.payments (
  id           uuid primary key default uuid_generate_v4(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  fecha        date not null default current_date,
  monto        numeric(12,2) not null check (monto > 0),
  metodo       text not null check (metodo in ('Transferencia','Cheque','Efectivo','Tarjeta','Otro')),
  referencia   text,
  conciliado   boolean not null default false,
  bank_transaction_id uuid,
  user_id      uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

-- Trigger: actualizar estado_pago automáticamente
create or replace function public.tg_update_invoice_payment_state() returns trigger language plpgsql as $$
declare v_total numeric; v_paid numeric;
begin
  select total into v_total from public.invoices where id = NEW.invoice_id;
  select coalesce(sum(monto),0) into v_paid from public.payments where invoice_id = NEW.invoice_id;
  update public.invoices set
    estado_pago = case when v_paid >= v_total then 'pagada'::factura_pago_estado
                       when v_paid > 0 then 'parcial'::factura_pago_estado
                       else 'pendiente'::factura_pago_estado end,
    updated_at = now()
  where id = NEW.invoice_id;
  return NEW;
end; $$;
create trigger trg_update_invoice_payment_state after insert or update on public.payments
  for each row execute function public.tg_update_invoice_payment_state();

-- =========================================
-- BANCO Y CONCILIACIÓN
-- =========================================
create table public.bank_transactions (
  id          uuid primary key default uuid_generate_v4(),
  fecha       date not null,
  monto       numeric(12,2) not null,
  descripcion text,
  referencia  text,
  conciliado  boolean not null default false,
  payment_id  uuid references public.payments(id),
  created_at  timestamptz not null default now()
);

create table public.collection_notes (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  user_id     uuid references public.profiles(id),
  fecha       date not null default current_date,
  nota        text not null,
  proxima_gestion date,
  created_at  timestamptz not null default now()
);

-- =========================================
-- ORDENES DE COMPRA
-- =========================================
create table public.purchase_orders (
  id          uuid primary key default uuid_generate_v4(),
  numero      text unique not null,
  supplier_id uuid not null references public.suppliers(id),
  fecha       date not null default current_date,
  eta         date not null,
  eta_real    date,
  estado      oc_estado not null default 'borrador',
  moneda      text not null default 'CLP',
  total       numeric(14,2) not null default 0,
  observaciones text,
  historial   jsonb default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.purchase_order_items (
  id          uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  cantidad    int not null check (cantidad > 0),
  costo_unit  numeric(12,2) not null,
  total       numeric(14,2) not null
);

create table public.purchase_order_documents (
  id          uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  tipo        text not null check (tipo in ('Invoice','Proforma','Packing List','Bill of Lading','Comprobante de pago','Otros')),
  nombre      text not null,
  storage_path text not null,
  size_bytes  bigint,
  user_id     uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create table public.receptions (
  id              uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  fecha           date not null default current_date,
  user_id         uuid references public.profiles(id),
  completa        boolean not null default false,
  observaciones   text,
  created_at      timestamptz not null default now()
);
create table public.reception_items (
  id           uuid primary key default uuid_generate_v4(),
  reception_id uuid not null references public.receptions(id) on delete cascade,
  product_id   uuid not null references public.products(id),
  cantidad_oc  int not null,
  cantidad_recibida int not null
);

create table public.supplier_invoices (
  id            uuid primary key default uuid_generate_v4(),
  supplier_id   uuid not null references public.suppliers(id),
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  numero        text not null,
  moneda        text not null default 'CLP',
  total         numeric(14,2) not null,
  saldo         numeric(14,2) not null,
  fecha_emision date not null,
  fecha_vencimiento date not null,
  estado        proveedor_factura_estado not null default 'pendiente',
  pagos         jsonb default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

-- =========================================
-- DEUDA Y PRÉSTAMOS
-- =========================================
create table public.debts (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  institucion     text not null,
  tipo            debt_tipo not null,
  moneda          text not null default 'CLP',
  monto_original  numeric(14,2) not null,
  saldo_pendiente numeric(14,2) not null,
  tasa_anual      numeric(6,4) not null,
  tipo_tasa       debt_tipo_tasa not null default 'fija',
  fecha_inicio    date not null,
  fecha_vencimiento date not null,
  cuotas          int not null,
  cuota_mensual   numeric(14,2) not null,
  dia_pago        int not null check (dia_pago between 1 and 31),
  estado          debt_estado not null default 'activa',
  observaciones   text,
  created_at      timestamptz not null default now()
);

create table public.debt_payments (
  id            uuid primary key default uuid_generate_v4(),
  debt_id       uuid not null references public.debts(id) on delete cascade,
  fecha         date not null,
  capital       numeric(14,2) not null,
  interes       numeric(14,2) not null,
  saldo_restante numeric(14,2) not null,
  metodo        text,
  referencia    text,
  comprobante_path text,
  observaciones text,
  user_id       uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- =========================================
-- FINANZAS · gastos operacionales
-- =========================================
create table public.expense_categories (
  id     text primary key,
  nombre text unique not null,
  tipo   expense_tipo not null default 'sga'
);

create table public.operating_expenses (
  id            uuid primary key default uuid_generate_v4(),
  categoria_id  text not null references public.expense_categories(id),
  descripcion   text not null,
  fecha         date not null,
  monto         numeric(14,2) not null,
  moneda        text not null default 'CLP',
  recurrente    boolean not null default false,
  centro_costo  text,
  comprobante_path text,
  user_id       uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create table public.financial_settings (
  id                  int primary key default 1 check (id=1),
  moneda_principal    text not null default 'CLP',
  tasa_iva            numeric(6,4) not null default 0.19,
  caja_inicial        numeric(14,2) not null default 0,
  capital_inicial     numeric(14,2) not null default 0,
  centros_costo       text[] not null default array['Operaciones','Logística','Administración','Comercial'],
  updated_at          timestamptz not null default now()
);

-- =========================================
-- AUTOMATIZACIONES
-- =========================================
create table public.automations (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  activa          boolean not null default true,
  trigger_entity  text not null,
  trigger_condicion text not null,
  trigger_valor   text,
  acciones        jsonb not null default '[]'::jsonb,
  ejecuciones     int not null default 0,
  ultima_ejecucion timestamptz,
  created_at      timestamptz not null default now()
);

create table public.approval_rules (
  id         uuid primary key default uuid_generate_v4(),
  nombre     text not null,
  tipo       text not null,
  umbral     numeric(14,2) not null,
  comparador text not null default 'mayor_a',
  unidad     text not null,
  requiere_rol text not null references public.roles(id),
  activa     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  titulo      text not null,
  responsable text,
  user_id     uuid references public.profiles(id),
  origen      text default 'manual',
  origen_ref  text,
  estado      text not null default 'pendiente' check (estado in ('pendiente','en_proceso','completada','cancelada')),
  fecha_limite date,
  created_at  timestamptz not null default now()
);

-- =========================================
-- WHATSAPP / AGENTE COMERCIAL
-- =========================================
create table public.message_templates (
  id        uuid primary key default uuid_generate_v4(),
  key       text unique not null,
  nombre    text not null,
  contenido text not null,
  updated_at timestamptz not null default now()
);

create table public.messaging_integrations (
  id            uuid primary key default uuid_generate_v4(),
  canal         text not null,
  nombre        text not null,
  activa        boolean not null default true,
  configuracion jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table public.whatsapp_conversations (
  id              uuid primary key default uuid_generate_v4(),
  telefono        text not null,
  client_id       uuid references public.clients(id) on delete set null,
  estado          wa_conv_estado not null default 'nuevo',
  responsable_id  uuid references public.profiles(id) on delete set null,
  draft_id        uuid,
  sales_order_id  uuid references public.sales_orders(id) on delete set null,
  intentos_fallidos int not null default 0,
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index wa_conv_telefono_idx on public.whatsapp_conversations(telefono);
create index wa_conv_estado_idx on public.whatsapp_conversations(estado);

create table public.whatsapp_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  direccion       text not null check (direccion in ('in','out')),
  texto           text not null,
  autor           text not null check (autor in ('cliente','agente','humano')),
  provider_message_id text,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);
create index wa_messages_conv_idx on public.whatsapp_messages(conversation_id, created_at);

create table public.whatsapp_drafts (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  client_id       uuid references public.clients(id),
  items           jsonb not null default '[]'::jsonb,
  despacho        jsonb,
  fecha_requerida date,
  condiciones_especiales text,
  estimado_neto   numeric(12,2) default 0,
  estimado_total  numeric(12,2) default 0,
  updated_at      timestamptz not null default now()
);

create table public.ai_agent_logs (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.whatsapp_conversations(id) on delete cascade,
  decision        text not null,
  detalle         text,
  confianza       numeric(3,2) default 1.0,
  created_at      timestamptz not null default now()
);

create table public.human_handoffs (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.whatsapp_conversations(id) on delete cascade,
  fecha           date not null default current_date,
  motivo          ai_handoff_motivo not null,
  detalle         text,
  responsable_id  uuid references public.profiles(id),
  resuelto        boolean not null default false,
  resuelto_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- =========================================
-- EMAIL OUTBOX (auditoría de envíos)
-- =========================================
create table public.email_outbox (
  id              uuid primary key default uuid_generate_v4(),
  provider        text not null,
  kind            text not null,
  to_addr         text not null,
  from_addr       text not null,
  subject         text not null,
  body_text       text,
  body_html       text,
  status          text not null default 'queued' check (status in ('queued','sent','error')),
  provider_message_id text,
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index email_outbox_status_idx on public.email_outbox(status, created_at desc);

-- =========================================
-- TIMESTAMPS automáticos updated_at
-- =========================================
create or replace function public.tg_set_updated_at() returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end; $$;

do $$ declare t text; begin
  for t in select unnest(array['profiles','suppliers','products','clients','invoices','financial_settings']) loop
    execute format('create trigger trg_updated_at_%I before update on public.%I for each row execute function public.tg_set_updated_at();', t, t);
  end loop;
end $$;

-- =========================================
-- FUNCIÓN ATÓMICA: emitir factura desde OV
-- =========================================
create or replace function public.emitir_factura(
  p_sales_order_id uuid, p_provider_name text, p_provider_response jsonb,
  p_provider_folio text, p_provider_track_id text
) returns uuid language plpgsql security definer as $$
declare v_ov public.sales_orders%rowtype; v_invoice_id uuid;
begin
  select * into v_ov from public.sales_orders where id = p_sales_order_id;
  if not found then raise exception 'OV no encontrada'; end if;

  insert into public.invoices(sales_order_id, client_id, fecha_emision, fecha_vencimiento, neto, iva, total,
                              estado_factura, provider_name, provider_response, provider_folio, provider_track_id)
  values (v_ov.id, v_ov.client_id, current_date, current_date + interval '30 days',
          v_ov.neto, v_ov.iva, v_ov.total, 'emitida', p_provider_name, p_provider_response, p_provider_folio, p_provider_track_id)
  returning id into v_invoice_id;

  insert into public.invoice_items(invoice_id, product_id, cantidad, precio, descuento_tipo, descuento_valor, total, costo_snapshot)
  select v_invoice_id, product_id, cantidad, precio, descuento_tipo, descuento_valor, total, costo_snapshot
  from public.sales_order_items where sales_order_id = v_ov.id;

  update public.sales_orders set estado = 'facturada' where id = v_ov.id;
  return v_invoice_id;
end; $$;

-- =========================================
-- HELPERS para RLS
-- =========================================
create or replace function public.current_role_id() returns text language sql security definer stable as $$
  select role_id from public.profiles where id = auth.uid();
$$;
create or replace function public.has_permission(perm_key text) returns boolean language sql security definer stable as $$
  select coalesce(
    -- override de usuario
    (select (permisos_override -> perm_key)::boolean from public.profiles where id = auth.uid()),
    -- permiso del rol
    (select (r.permisos -> perm_key)::boolean from public.profiles p join public.roles r on r.id = p.role_id where p.id = auth.uid()),
    false
  );
$$;
create or replace function public.is_admin() returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles p join public.roles r on r.id = p.role_id where p.id = auth.uid() and r.nombre='Administrador');
$$;
