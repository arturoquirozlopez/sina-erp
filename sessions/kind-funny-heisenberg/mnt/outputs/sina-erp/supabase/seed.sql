-- =====================================================================================
-- SEED · roles, permisos, pickup_points, categorías, settings
-- (datos comerciales se cargan después vía la app)
-- =====================================================================================

-- Roles del sistema con permisos predefinidos
insert into public.roles(id, nombre, descripcion, sistema, permisos) values
  ('R1','Administrador','Acceso completo', true, jsonb_build_object(
    'usuarios.gestionar', true, 'config.gestionar', true,
    'inventario.ver',true,'inventario.crear',true,'inventario.editar',true,'inventario.eliminar',true,'inventario.importar',true,'inventario.exportar',true,'inventario.transferir',true,
    'clientes.ver',true,'clientes.crear',true,'clientes.editar',true,'clientes.eliminar',true,
    'ventas.ver',true,'ventas.crear',true,'ventas.editar',true,'ventas.eliminar',true,'ventas.confirmar',true,
    'cotizaciones.ver',true,'cotizaciones.crear',true,'cotizaciones.editar',true,'cotizaciones.eliminar',true,'cotizaciones.aprobar',true,
    'facturacion.ver',true,'facturacion.emitir',true,'facturacion.anular',true,
    'cobranza.ver',true,'cobranza.registrar_pago',true,'cobranza.conciliar',true,
    'compras.ver',true,'compras.crear',true,'compras.editar',true,'compras.eliminar',true,'compras.aprobar',true,'compras.recibir',true,
    'proveedores.ver',true,'proveedores.crear',true,'proveedores.editar',true,'proveedores.eliminar',true,
    'finanzas.ver',true,'finanzas.editar',true,'er.ver',true,'balance.ver',true,
    'deuda.ver',true,'deuda.editar',true,
    'puntos_retiro.ver',true,'puntos_retiro.editar',true,'puntos_retiro.transferir',true,
    'reportes.ver',true,
    'mensajeria.ver',true,'mensajeria.responder',true,'mensajeria.derivar',true,
    'automatizaciones.ver',true,'automatizaciones.editar',true
  )),
  ('R2','Gerencia','Lectura total + edición finanzas y usuarios', false, jsonb_build_object(
    'inventario.ver',true,'clientes.ver',true,'ventas.ver',true,'cotizaciones.ver',true,
    'facturacion.ver',true,'cobranza.ver',true,'compras.ver',true,'proveedores.ver',true,
    'finanzas.ver',true,'finanzas.editar',true,'er.ver',true,'balance.ver',true,
    'deuda.ver',true,'deuda.editar',true,'puntos_retiro.ver',true,'reportes.ver',true,
    'usuarios.gestionar',true,'automatizaciones.ver',true,'mensajeria.ver',true
  )),
  ('R3','Finanzas','Finanzas, cobranza y deuda', false, jsonb_build_object(
    'finanzas.ver',true,'finanzas.editar',true,'er.ver',true,'balance.ver',true,
    'deuda.ver',true,'deuda.editar',true,
    'cobranza.ver',true,'cobranza.registrar_pago',true,'cobranza.conciliar',true,
    'facturacion.ver',true,'facturacion.emitir',true,
    'reportes.ver',true,'clientes.ver',true,'ventas.ver',true,'compras.ver',true
  )),
  ('R4','Compras','Compras, proveedores e inventario', false, jsonb_build_object(
    'compras.ver',true,'compras.crear',true,'compras.editar',true,'compras.aprobar',true,'compras.recibir',true,
    'proveedores.ver',true,'proveedores.crear',true,'proveedores.editar',true,
    'inventario.ver',true,'inventario.editar',true,'inventario.importar',true,'inventario.exportar',true,'inventario.transferir',true,
    'reportes.ver',true,'puntos_retiro.ver',true
  )),
  ('R5','Ventas','Cotizaciones, OV y clientes', false, jsonb_build_object(
    'ventas.ver',true,'ventas.crear',true,'ventas.editar',true,'ventas.confirmar',true,
    'cotizaciones.ver',true,'cotizaciones.crear',true,'cotizaciones.editar',true,
    'clientes.ver',true,'clientes.crear',true,'clientes.editar',true,
    'mensajeria.ver',true,'mensajeria.responder',true,
    'inventario.ver',true,'reportes.ver',true
  )),
  ('R6','Operaciones','Operación diaria y puntos de retiro', false, jsonb_build_object(
    'inventario.ver',true,'inventario.editar',true,'inventario.transferir',true,
    'puntos_retiro.ver',true,'puntos_retiro.editar',true,'puntos_retiro.transferir',true,
    'ventas.ver',true,'compras.ver',true,'compras.recibir',true,'reportes.ver',true
  )),
  ('R7','Bodega','Gestión de stock y recepciones', false, jsonb_build_object(
    'inventario.ver',true,'inventario.editar',true,'inventario.transferir',true,
    'puntos_retiro.ver',true,'puntos_retiro.transferir',true,
    'compras.ver',true,'compras.recibir',true
  )),
  ('R8','Solo lectura','Acceso de consulta', false, jsonb_build_object(
    'inventario.ver',true,'clientes.ver',true,'ventas.ver',true,'cotizaciones.ver',true,
    'facturacion.ver',true,'cobranza.ver',true,'compras.ver',true,'proveedores.ver',true,
    'finanzas.ver',true,'reportes.ver',true,'puntos_retiro.ver',true,'mensajeria.ver',true,'deuda.ver',true
  ))
on conflict (id) do update set permisos = excluded.permisos;

-- Puntos de retiro (Bodega Central + 2 puntos)
insert into public.pickup_points(id, nombre, tipo, direccion, comuna, ciudad, responsable, telefono, email, horario, estado) values
  ('BC',  'Bodega Central',              'bodega', 'Av. Vicuña Mackenna 4860', 'Macul',     'Santiago', 'Pedro Soto',     '+56 2 2345 6789',  'bodega@gruposina.cl',     'Lun a Vie 8:30-18:00 · Sáb 9:00-13:00', 'activo'),
  ('PR1', 'Punto de Retiro Las Condes',  'punto',  'Av. Apoquindo 5234',       'Las Condes','Santiago', 'Carolina Vidal', '+56 2 2876 1234',  'lascondes@gruposina.cl',  'Lun a Vie 9:00-19:00',                  'activo'),
  ('PR2', 'Punto de Retiro La Florida',  'punto',  'Av. Vicuña Mackenna 7890', 'La Florida','Santiago', 'Diego Pérez',    '+56 2 2440 9988',  'laflorida@gruposina.cl',  'Lun a Vie 9:00-19:00 · Sáb 10:00-14:00','activo')
on conflict (id) do nothing;

-- Categorías de gastos
insert into public.expense_categories(id, nombre, tipo) values
  ('EC1','Sueldos y equipo','sga'),('EC2','Despacho','sga'),('EC3','Arriendo','sga'),
  ('EC4','Marketing','sga'),('EC5','Software','sga'),('EC6','Administración','sga'),
  ('EC7','Contabilidad','sga'),('EC8','Otros','sga')
on conflict (id) do nothing;

-- Configuración financiera
insert into public.financial_settings(id, moneda_principal, tasa_iva, caja_inicial, capital_inicial)
  values (1, 'CLP', 0.19, 35000000, 120000000)
on conflict (id) do update set moneda_principal=excluded.moneda_principal, tasa_iva=excluded.tasa_iva;

-- Plantillas de mensajes para WhatsApp
insert into public.message_templates(key, nombre, contenido) values
  ('bienvenida',          'Mensaje de bienvenida',          'Hola {cliente}, soy el agente comercial de Sina. ¿En qué puedo ayudarte hoy?'),
  ('solicitar_info',      'Solicitar información faltante', 'Para procesar tu pedido necesito: {campos_faltantes}. ¿Me los puedes confirmar?'),
  ('resumen_pedido',      'Resumen de pedido',              'Resumen del pedido:\n{items}\nTotal estimado: {total} + IVA. ¿Confirmas?'),
  ('confirmacion_pedido', 'Confirmación de pedido',         'Listo. Tu pedido quedó ingresado con el número {numero_ov}. Te avisaremos cuando esté en preparación.'),
  ('sin_stock',           'Producto sin stock',             'Lamentablemente {producto} no tiene stock disponible. {alternativas}'),
  ('derivacion_humano',   'Derivación a humano',            'Te derivo con un ejecutivo de Sina que podrá ayudarte mejor. En unos minutos te contactará.'),
  ('pedir_rut',           'Solicitar RUT',                  'Para asociar el pedido necesito tu RUT o razón social. ¿Me lo puedes confirmar?'),
  ('pedir_despacho',      'Solicitar despacho',             '¿Es para retiro en bodega o despacho? Si es despacho, ¿a qué dirección?')
on conflict (key) do nothing;
