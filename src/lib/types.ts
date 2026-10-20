// =====================================================================
// CARWASH — Tipos de datos (espejo exacto del esquema Supabase)
// =====================================================================

export type Rol = 'admin' | 'supervisor' | 'cajero' | 'lavador';
export type TipoVehiculo = 'carro' | 'moto';
export type EstadoOrden = 'recibido' | 'en_proceso' | 'terminado' | 'pagado' | 'entregado' | 'cancelado';

export const ESTADOS_ORDEN: EstadoOrden[] = ['recibido', 'en_proceso', 'terminado', 'pagado', 'entregado'];

export interface Organizacion {
  id: string;
  nombre: string;
  nit?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  logo_url?: string | null;
  color_primario?: string | null;
  moneda: string;
  activa: boolean;
}

export interface Empleado {
  id: string;
  organizacion_id: string;
  auth_user_id?: string | null;
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  rol: Rol;
  porcentaje_comision: number;
  tipo_pago: 'comision' | 'fijo' | 'mixto';
  activo: boolean;
  fecha_ingreso: string;
}

export interface Cliente {
  id: string;
  organizacion_id: string;
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  direccion?: string | null;
  observaciones?: string | null;
  puntos: number;
  total_gastado: number;
  ultima_visita?: string | null;
  activo: boolean;
}

export interface Vehiculo {
  id: string;
  organizacion_id: string;
  cliente_id: string;
  placa: string;
  tipo: TipoVehiculo;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  color?: string | null;
  kilometraje?: number | null;
  observaciones?: string | null;
  ultimo_lavado?: string | null;
  lavados_acumulados: number;
  total_gastado: number;
  activo: boolean;
}

export interface Servicio {
  id: string;
  organizacion_id: string;
  nombre: string;
  descripcion?: string | null;
  tipo_vehiculo: TipoVehiculo | 'ambos';
  precio: number;
  duracion_min: number;
  activo: boolean;
}

export interface ServicioAdicional {
  id: string;
  organizacion_id: string;
  nombre: string;
  precio: number;
  activo: boolean;
}

export interface Orden {
  id: string;
  organizacion_id: string;
  numero: number;
  cliente_id: string;
  vehiculo_id: string;
  servicio_id: string;
  empleado_id?: string | null;
  estado: EstadoOrden;
  precio_servicio: number;
  total_extras: number;
  total: number;
  observaciones?: string | null;
  kilometraje?: number | null;
  fecha_entrada: string;
  fecha_terminado?: string | null;
  fecha_entregado?: string | null;
}

export interface OrdenExtra {
  id: string;
  organizacion_id: string;
  orden_id: string;
  adicional_id?: string | null;
  nombre: string;
  precio: number;
}

export interface OrdenFoto {
  id: string;
  organizacion_id: string;
  orden_id: string;
  fase: 'entrada' | 'salida';
  posicion?: string | null;
  url: string;
}

export interface MetodoPago {
  id: string;
  organizacion_id: string;
  nombre: string;
  tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';
  activo: boolean;
}

export interface Pago {
  id: string;
  organizacion_id: string;
  orden_id: string;
  metodo_id?: string | null;
  monto: number;
  referencia?: string | null;
  fecha: string;
}

export interface CajaSesion {
  id: string;
  organizacion_id: string;
  empleado_id?: string | null;
  fecha: string;
  monto_apertura: number;
  monto_cierre?: number | null;
  monto_esperado?: number | null;
  diferencia?: number | null;
  estado: 'abierta' | 'cerrada';
  observaciones?: string | null;
  abierta_at: string;
  cerrada_at?: string | null;
}

export interface CajaMovimiento {
  id: string;
  organizacion_id: string;
  sesion_id?: string | null;
  tipo: 'entrada' | 'salida';
  categoria: string;
  concepto: string;
  monto: number;
  metodo: string;
  referencia?: string | null;
  fecha: string;
}

export interface InventarioProducto {
  id: string;
  organizacion_id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor?: string | null;
  activo: boolean;
}

export interface InventarioMovimiento {
  id: string;
  organizacion_id: string;
  producto_id: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  orden_id?: string | null;
  notas?: string | null;
  fecha: string;
}

export interface ServicioConsumo {
  id: string;
  organizacion_id: string;
  servicio_id: string;
  producto_id: string;
  cantidad: number;
}

export interface PeriodoNomina {
  id: string;
  organizacion_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_frecuencia: 'semanal' | 'quincenal' | 'mensual' | 'otro';
  estado: 'abierto' | 'cerrado';
  total_comisiones: number;
}

export interface Comision {
  id: string;
  organizacion_id: string;
  orden_id: string;
  empleado_id: string;
  periodo_id?: string | null;
  base: number;
  porcentaje: number;
  monto: number;
  estado: 'pendiente' | 'pagada';
  fecha: string;
}

export interface PagoNomina {
  id: string;
  organizacion_id: string;
  periodo_id: string;
  empleado_id: string;
  monto: number;
  metodo: string;
  notas?: string | null;
  fecha: string;
}

export interface FidelidadMovimiento {
  id: string;
  organizacion_id: string;
  cliente_id: string;
  tipo: 'ganado' | 'canjeado' | 'ajuste';
  puntos: number;
  descripcion?: string | null;
  orden_id?: string | null;
  fecha: string;
}

export interface Membresia {
  id: string;
  organizacion_id: string;
  nombre: string;
  precio: number;
  lavados_incluidos?: number | null;
  vigencia_dias: number;
  descripcion?: string | null;
  activo: boolean;
}

export interface MembresiaSuscripcion {
  id: string;
  organizacion_id: string;
  membresia_id: string;
  cliente_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  lavados_usados: number;
  estado: 'activa' | 'vencida' | 'cancelada';
}

export interface Reserva {
  id: string;
  organizacion_id: string;
  codigo: string;
  cliente_id?: string | null;
  nombre_visitante?: string | null;
  telefono_visitante?: string | null;
  vehiculo_id?: string | null;
  servicio_id: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string | null;
}

export interface WhatsappPlantilla {
  id: string;
  organizacion_id: string;
  codigo: 'recepcion' | 'terminado' | 'promocion' | 'fidelizacion';
  mensaje: string;
  activo: boolean;
}

export interface Configuracion {
  organizacion_id: string;
  meta_diaria: number;
  puntos_por_monto: number;
  dias_inactivo_ia: number;
  whatsapp_pais: string;
}

// Nombre de todas las tablas gestionadas por el CRUD genérico
export type Tabla =
  | 'empleados' | 'clientes' | 'vehiculos' | 'servicios' | 'servicios_adicionales'
  | 'ordenes' | 'orden_extras' | 'orden_fotos' | 'metodos_pago' | 'pagos'
  | 'caja_sesiones' | 'caja_movimientos' | 'inventario_productos' | 'inventario_movimientos'
  | 'servicio_consumos' | 'periodos_nomina' | 'comisiones' | 'pagos_nomina'
  | 'fidelidad_movimientos' | 'membresias' | 'membresia_suscripciones' | 'reservas'
  | 'whatsapp_plantillas' | 'configuraciones';

// Índice tipado de los datos cargados en memoria
export interface DatosApp {
  empleados: Empleado[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: Servicio[];
  servicios_adicionales: ServicioAdicional[];
  ordenes: Orden[];
  orden_extras: OrdenExtra[];
  orden_fotos: OrdenFoto[];
  metodos_pago: MetodoPago[];
  pagos: Pago[];
  caja_sesiones: CajaSesion[];
  caja_movimientos: CajaMovimiento[];
  inventario_productos: InventarioProducto[];
  inventario_movimientos: InventarioMovimiento[];
  servicio_consumos: ServicioConsumo[];
  periodos_nomina: PeriodoNomina[];
  comisiones: Comision[];
  pagos_nomina: PagoNomina[];
  fidelidad_movimientos: FidelidadMovimiento[];
  membresias: Membresia[];
  membresia_suscripciones: MembresiaSuscripcion[];
  reservas: Reserva[];
  whatsapp_plantillas: WhatsappPlantilla[];
  configuraciones: Configuracion[];
}

export type TablaDatos = keyof DatosApp;

export const TABLAS_CARGA: TablaDatos[] = [
  'empleados', 'clientes', 'vehiculos', 'servicios', 'servicios_adicionales', 'ordenes',
  'orden_extras', 'orden_fotos', 'metodos_pago', 'pagos', 'caja_sesiones', 'caja_movimientos',
  'inventario_productos', 'inventario_movimientos', 'servicio_consumos', 'periodos_nomina',
  'comisiones', 'pagos_nomina', 'fidelidad_movimientos', 'membresias', 'membresia_suscripciones',
  'reservas', 'whatsapp_plantillas', 'configuraciones',
];
