export type Permission =
  | 'usuarios.gestionar' | 'config.gestionar'
  | 'inventario.ver' | 'inventario.crear' | 'inventario.editar' | 'inventario.eliminar' | 'inventario.importar' | 'inventario.exportar' | 'inventario.transferir'
  | 'clientes.ver' | 'clientes.crear' | 'clientes.editar' | 'clientes.eliminar'
  | 'ventas.ver' | 'ventas.crear' | 'ventas.editar' | 'ventas.eliminar' | 'ventas.confirmar'
  | 'cotizaciones.ver' | 'cotizaciones.crear' | 'cotizaciones.editar' | 'cotizaciones.eliminar' | 'cotizaciones.aprobar'
  | 'facturacion.ver' | 'facturacion.emitir' | 'facturacion.anular'
  | 'cobranza.ver' | 'cobranza.registrar_pago' | 'cobranza.conciliar'
  | 'compras.ver' | 'compras.crear' | 'compras.editar' | 'compras.eliminar' | 'compras.aprobar' | 'compras.recibir'
  | 'proveedores.ver' | 'proveedores.crear' | 'proveedores.editar' | 'proveedores.eliminar'
  | 'finanzas.ver' | 'finanzas.editar' | 'er.ver' | 'balance.ver'
  | 'deuda.ver' | 'deuda.editar'
  | 'puntos_retiro.ver' | 'puntos_retiro.editar' | 'puntos_retiro.transferir'
  | 'reportes.ver'
  | 'mensajeria.ver' | 'mensajeria.responder' | 'mensajeria.derivar'
  | 'automatizaciones.ver' | 'automatizaciones.editar';

export type RoleId = 'R1'|'R2'|'R3'|'R4'|'R5'|'R6'|'R7'|'R8';

export type ProfileWithRole = {
  id: string; email: string; nombre: string; apellido: string;
  telefono: string | null; cargo: string | null; area: string | null;
  role_id: RoleId; activo: boolean; ultimo_login: string | null;
  permisos_override: Record<string, boolean>;
  role: { id: string; nombre: string; permisos: Record<string, boolean> } | null;
};

export type Cliente = {
  id: string; razon_social: string; rut: string; contacto: string | null;
  email: string | null; telefono: string | null; direccion: string | null;
  comuna: string | null; ciudad: string | null;
  segmento: 'constructora'|'ferreteria'|'pintor'|'retail'|'industria'|'inmobiliaria'|'mayorista';
  estado: 'activo'|'inactivo'|'riesgo_fuga'|'perdido';
  ejecutivo_id: string | null; notas: string | null;
  created_at: string; updated_at: string;
};

export type Producto = {
  id: string; sku: string; nombre: string; categoria: string;
  acabado: string | null; color: string | null; formato: string | null;
  descripcion: string | null; proveedor_id: string | null;
  costo: number; precio: number; stock_min: number; stock_reco: number;
  activo: boolean; created_at: string; updated_at: string;
};

export type Invitation = {
  id: string; email: string; first_name: string; last_name: string;
  cargo: string | null; area: string | null; role_id: string;
  invitation_token: string; status: 'pending'|'accepted'|'expired'|'cancelled';
  expires_at: string; accepted_at: string | null; last_resent_at: string | null;
  created_at: string;
};
