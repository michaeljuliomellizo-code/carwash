// =====================================================================
// MODO DEMO — dataset de ejemplo persistido en localStorage.
// Permite probar TODOS los módulos sin credenciales de Supabase.
// =====================================================================

import type { DatosApp, TablaDatos } from './types';
import { uid, hoyISO } from './format';

const CLAVE = 'carwash_demo_v1';
const ORG = 'org-demo-0001';

const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const fechaAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export function datasetDemo(): DatosApp {
  const empleados = [
    { id: 'emp-1', nombre: 'Carlos Gómez', rol: 'admin' as const, porcentaje_comision: 30, telefono: '3001112233', documento: '101020', activo: true, fecha_ingreso: fechaAtras(400) },
    { id: 'emp-2', nombre: 'María Ruiz', rol: 'supervisor' as const, porcentaje_comision: 25, telefono: '3002223344', documento: '101021', activo: true, fecha_ingreso: fechaAtras(300) },
    { id: 'emp-3', nombre: 'Luis Torres', rol: 'lavador' as const, porcentaje_comision: 30, telefono: '3003334455', documento: '101022', activo: true, fecha_ingreso: fechaAtras(200) },
    { id: 'emp-4', nombre: 'Ana Martínez', rol: 'lavador' as const, porcentaje_comision: 30, telefono: '3004445566', documento: '101023', activo: true, fecha_ingreso: fechaAtras(150) },
    { id: 'emp-5', nombre: 'Jorge Pérez', rol: 'cajero' as const, porcentaje_comision: 0, telefono: '3005556677', documento: '101024', activo: true, fecha_ingreso: fechaAtras(100) },
  ].map(e => ({ ...e, organizacion_id: ORG, auth_user_id: null, email: null, tipo_pago: e.porcentaje_comision > 0 ? 'comision' : 'fijo' } as DatosApp['empleados'][number]));

  const clientes = [
    { id: 'cli-1', nombre: 'Juan Pérez', documento: '79875645', telefono: '3111234567', whatsapp: '3111234567', email: 'juan@ejemplo.com', direccion: 'Calle 45 #23-11', puntos: 128, total_gastado: 1250000, ultima_visita: diasAtras(2), observaciones: null, activo: true },
    { id: 'cli-2', nombre: 'Roberto Sánchez', documento: '71122334', telefono: '3122345678', whatsapp: '3122345678', email: null, direccion: 'Cra 7 #12-30', puntos: 45, total_gastado: 480000, ultima_visita: diasAtras(45), observaciones: 'Prefiere lavado sin silicona', activo: true },
    { id: 'cli-3', nombre: 'Laura Gómez', documento: '52341234', telefono: '3133456789', whatsapp: '3133456789', email: 'laura@ejemplo.com', direccion: 'Av 68 #40-10', puntos: 210, total_gastado: 2100000, ultima_visita: diasAtras(1), observaciones: null, activo: true },
    { id: 'cli-4', nombre: 'Pedro Ramírez', documento: '80123123', telefono: '3144567890', whatsapp: '3144567890', email: null, direccion: null, puntos: 12, total_gastado: 120000, ultima_visita: diasAtras(60), observaciones: null, activo: true },
  ].map(c => ({ ...c, organizacion_id: ORG }) as DatosApp['clientes'][number]);

  const vehiculos = [
    { id: 'veh-1', cliente_id: 'cli-1', placa: 'ABC123', tipo: 'carro' as const, marca: 'Chevrolet', modelo: 'Onix', anio: 2022, color: 'Blanco', kilometraje: 32000, observaciones: null, ultimo_lavado: fechaAtras(2), lavados_acumulados: 18, total_gastado: 450000, activo: true },
    { id: 'veh-2', cliente_id: 'cli-1', placa: 'XYZ987', tipo: 'carro' as const, marca: 'Mazda', modelo: 'CX-5', anio: 2023, color: 'Rojo', kilometraje: 15000, observaciones: null, ultimo_lavado: fechaAtras(10), lavados_acumulados: 6, total_gastado: 190000, activo: true },
    { id: 'veh-3', cliente_id: 'cli-2', placa: 'KLM456', tipo: 'moto' as const, marca: 'Yamaha', modelo: 'XTZ 150', anio: 2021, color: 'Azul', kilometraje: 41000, observaciones: 'Rayón puerta trasera derecho', ultimo_lavado: fechaAtras(45), lavados_acumulados: 9, total_gastado: 108000, activo: true },
    { id: 'veh-4', cliente_id: 'cli-3', placa: 'PQR789', tipo: 'carro' as const, marca: 'Toyota', modelo: 'Corolla', anio: 2024, color: 'Gris', kilometraje: 8000, observaciones: null, ultimo_lavado: fechaAtras(1), lavados_acumulados: 22, total_gastado: 640000, activo: true },
    { id: 'veh-5', cliente_id: 'cli-4', placa: 'STU321', tipo: 'moto' as const, marca: 'AKT', modelo: 'NKD 125', anio: 2020, color: 'Negro', kilometraje: 55000, observaciones: null, ultimo_lavado: fechaAtras(60), lavados_acumulados: 5, total_gastado: 55000, activo: true },
  ].map(v => ({ ...v, organizacion_id: ORG }) as DatosApp['vehiculos'][number]);

  const servicios = [
    { id: 'srv-1', nombre: 'Lavado básico', tipo_vehiculo: 'carro' as const, precio: 15000, duracion_min: 30, descripcion: null, activo: true },
    { id: 'srv-2', nombre: 'Lavado completo', tipo_vehiculo: 'carro' as const, precio: 25000, duracion_min: 45, descripcion: null, activo: true },
    { id: 'srv-3', nombre: 'Lavado premium', tipo_vehiculo: 'carro' as const, precio: 40000, duracion_min: 60, descripcion: 'Incluye cera y brillado', activo: true },
    { id: 'srv-4', nombre: 'Lavado + aspirado', tipo_vehiculo: 'carro' as const, precio: 30000, duracion_min: 50, descripcion: null, activo: true },
    { id: 'srv-5', nombre: 'Desinfección', tipo_vehiculo: 'carro' as const, precio: 20000, duracion_min: 40, descripcion: null, activo: true },
    { id: 'srv-6', nombre: 'Lavado básico', tipo_vehiculo: 'moto' as const, precio: 8000, duracion_min: 20, descripcion: null, activo: true },
    { id: 'srv-7', nombre: 'Lavado premium', tipo_vehiculo: 'moto' as const, precio: 15000, duracion_min: 30, descripcion: null, activo: true },
    { id: 'srv-8', nombre: 'Desengrase', tipo_vehiculo: 'moto' as const, precio: 12000, duracion_min: 25, descripcion: null, activo: true },
  ].map(s => ({ ...s, organizacion_id: ORG }) as DatosApp['servicios'][number]);

  const servicios_adicionales = [
    'Aspirado|8000', 'Brillado|10000', 'Encerado|15000', 'Polichado|25000', 'Desmanchado|20000',
    'Limpieza de tapicería|30000', 'Limpieza de motor|20000', 'Restauración de plásticos|12000',
    'Restauración de farolas|15000', 'Tratamiento cerámico|80000',
  ].map((s, i) => {
    const [nombre, precio] = s.split('|');
    return { id: `ext-${i + 1}`, organizacion_id: ORG, nombre, precio: Number(precio), activo: true } as DatosApp['servicios_adicionales'][number];
  });

  const metodos_pago = [
    { id: 'mp-1', nombre: 'Efectivo', tipo: 'efectivo' as const },
    { id: 'mp-2', nombre: 'Tarjeta', tipo: 'tarjeta' as const },
    { id: 'mp-3', nombre: 'Transferencia', tipo: 'transferencia' as const },
    { id: 'mp-4', nombre: 'Nequi', tipo: 'nequi' as const },
    { id: 'mp-5', nombre: 'Daviplata', tipo: 'daviplata' as const },
    { id: 'mp-6', nombre: 'Otros', tipo: 'otros' as const },
  ].map(m => ({ ...m, organizacion_id: ORG, activo: true }) as DatosApp['metodos_pago'][number]);

  // Órdenes: hoy (varias), ayer, y pasadas para reportes
  const ordenes: DatosApp['ordenes'] = [];
  const orden_extras: DatosApp['orden_extras'] = [];
  const pagos: DatosApp['pagos'] = [];
  const comisiones: DatosApp['comisiones'] = [];
  let numero = 1;
  const semilla: Array<[number, string, string, string, string, string, string | null]> = [
    // [diasAtras, clienteId, vehiculoId, servicioId, empleadoId, estado, metodoPago]
    [0, 'cli-1', 'veh-1', 'srv-3', 'emp-3', 'en_proceso', null],
    [0, 'cli-3', 'veh-4', 'srv-2', 'emp-4', 'terminado', null],
    [0, 'cli-2', 'veh-3', 'srv-7', 'emp-3', 'pagado', 'mp-4'],
    [0, 'cli-1', 'veh-2', 'srv-4', 'emp-4', 'recibido', null],
    [0, 'cli-3', 'veh-4', 'srv-1', 'emp-3', 'entregado', 'mp-1'],
    [1, 'cli-2', 'veh-3', 'srv-8', 'emp-4', 'entregado', 'mp-3'],
    [1, 'cli-1', 'veh-1', 'srv-2', 'emp-3', 'entregado', 'mp-1'],
    [2, 'cli-3', 'veh-4', 'srv-3', 'emp-4', 'entregado', 'mp-2'],
    [3, 'cli-4', 'veh-5', 'srv-6', 'emp-3', 'entregado', 'mp-1'],
    [4, 'cli-1', 'veh-2', 'srv-3', 'emp-4', 'entregado', 'mp-4'],
    [5, 'cli-2', 'veh-3', 'srv-7', 'emp-3', 'entregado', 'mp-1'],
    [6, 'cli-3', 'veh-4', 'srv-2', 'emp-3', 'entregado', 'mp-3'],
    [7, 'cli-1', 'veh-1', 'srv-5', 'emp-4', 'entregado', 'mp-1'],
    [8, 'cli-4', 'veh-5', 'srv-6', 'emp-3', 'entregado', 'mp-1'],
    [9, 'cli-3', 'veh-4', 'srv-3', 'emp-4', 'entregado', 'mp-2'],
  ];
  for (const [dias, cli, veh, srv, emp, estado, metodo] of semilla) {
    const servicio = servicios.find(s => s.id === srv)!;
    const id = `ord-${numero}`;
    const extrasIdx = numero % 3 === 0 ? [servicios_adicionales[numero % 10]] : [];
    const totalExtras = extrasIdx.reduce((a, e) => a + e.precio, 0);
    const fecha = diasAtras(dias);
    ordenes.push({
      id, organizacion_id: ORG, numero, cliente_id: cli, vehiculo_id: veh, servicio_id: srv,
      empleado_id: emp, estado: estado as DatosApp['ordenes'][number]['estado'],
      precio_servicio: servicio.precio, total_extras: totalExtras, total: servicio.precio + totalExtras,
      observaciones: null, kilometraje: null, fecha_entrada: fecha,
      fecha_terminado: ['terminado', 'pagado', 'entregado'].includes(estado) ? fecha : null,
      fecha_entregado: estado === 'entregado' ? fecha : null,
    });
    extrasIdx.forEach((e, i) => orden_extras.push({ id: `ox-${numero}-${i}`, organizacion_id: ORG, orden_id: id, adicional_id: e.id, nombre: e.nombre, precio: e.precio }));
    if (metodo) {
      pagos.push({ id: `pag-${numero}`, organizacion_id: ORG, orden_id: id, metodo_id: metodo, monto: servicio.precio + totalExtras, referencia: null, fecha });
      const empData = empleados.find(e => e.id === emp)!;
      if (empData.porcentaje_comision > 0) {
        comisiones.push({ id: `com-${numero}`, organizacion_id: ORG, orden_id: id, empleado_id: emp, periodo_id: null, base: servicio.precio + totalExtras, porcentaje: empData.porcentaje_comision, monto: Math.round((servicio.precio + totalExtras) * empData.porcentaje_comision) / 100, estado: 'pendiente', fecha });
      }
    }
    numero++;
  }

  const inventario_productos = [
    { id: 'inv-1', nombre: 'Shampoo', unidad: 'ml', stock: 3000, stock_minimo: 10000, costo_unitario: 15, proveedor: 'Químicos Andinos', activo: true },
    { id: 'inv-2', nombre: 'Cera', unidad: 'ml', stock: 2000, stock_minimo: 3000, costo_unitario: 40, proveedor: 'Químicos Andinos', activo: true },
    { id: 'inv-3', nombre: 'Desengrasante', unidad: 'ml', stock: 4500, stock_minimo: 5000, costo_unitario: 25, proveedor: null, activo: true },
    { id: 'inv-4', nombre: 'Silicona', unidad: 'ml', stock: 1000, stock_minimo: 2000, costo_unitario: 35, proveedor: null, activo: true },
    { id: 'inv-5', nombre: 'Ambientador', unidad: 'unidad', stock: 15, stock_minimo: 20, costo_unitario: 3000, proveedor: 'Autoparts SAS', activo: true },
    { id: 'inv-6', nombre: 'Paños', unidad: 'unidad', stock: 25, stock_minimo: 30, costo_unitario: 2000, proveedor: null, activo: true },
    { id: 'inv-7', nombre: 'Esponjas', unidad: 'unidad', stock: 18, stock_minimo: 25, costo_unitario: 1500, proveedor: null, activo: true },
    { id: 'inv-8', nombre: 'Guantes', unidad: 'unidad', stock: 12, stock_minimo: 10, costo_unitario: 4000, proveedor: null, activo: true },
  ].map(p => ({ ...p, organizacion_id: ORG }) as DatosApp['inventario_productos'][number]);

  const servicio_consumos = [
    { id: 'cons-1', servicio_id: 'srv-1', producto_id: 'inv-1', cantidad: 100 },
    { id: 'cons-2', servicio_id: 'srv-2', producto_id: 'inv-1', cantidad: 150 },
    { id: 'cons-3', servicio_id: 'srv-2', producto_id: 'inv-2', cantidad: 30 },
    { id: 'cons-4', servicio_id: 'srv-3', producto_id: 'inv-1', cantidad: 150 },
    { id: 'cons-5', servicio_id: 'srv-3', producto_id: 'inv-2', cantidad: 50 },
    { id: 'cons-6', servicio_id: 'srv-3', producto_id: 'inv-4', cantidad: 20 },
    { id: 'cons-7', servicio_id: 'srv-8', producto_id: 'inv-3', cantidad: 80 },
  ].map(c => ({ ...c, organizacion_id: ORG }) as DatosApp['servicio_consumos'][number]);

  const caja_sesiones: DatosApp['caja_sesiones'] = [
    { id: 'caja-hoy', organizacion_id: ORG, empleado_id: 'emp-5', fecha: hoyISO(), monto_apertura: 200000, monto_cierre: null, monto_esperado: null, diferencia: null, estado: 'abierta', observaciones: null, abierta_at: diasAtras(0), cerrada_at: null },
    { id: 'caja-ayer', organizacion_id: ORG, empleado_id: 'emp-5', fecha: fechaAtras(1), monto_apertura: 200000, monto_cierre: 415000, monto_esperado: 420000, diferencia: -5000, estado: 'cerrada', observaciones: 'Diferencia en billetes pequeños', abierta_at: diasAtras(1), cerrada_at: diasAtras(1) },
  ];
  const caja_movimientos: DatosApp['caja_movimientos'] = [
    { id: 'cmv-1', organizacion_id: ORG, sesion_id: 'caja-hoy', tipo: 'salida', categoria: 'compras', concepto: 'Compra de paños', monto: 20000, metodo: 'efectivo', referencia: null, fecha: diasAtras(0) },
    { id: 'cmv-2', organizacion_id: ORG, sesion_id: 'caja-ayer', tipo: 'salida', categoria: 'gastos', concepto: 'Almuerzo empleados', monto: 30000, metodo: 'efectivo', referencia: null, fecha: diasAtras(1) },
  ];

  const periodos_nomina: DatosApp['periodos_nomina'] = [
    { id: 'per-1', organizacion_id: ORG, nombre: 'Quincena 1 — ' + new Date().toLocaleDateString('es-CO', { month: 'long' }), fecha_inicio: fechaAtras(14), fecha_fin: fechaAtras(1), tipo_frecuencia: 'quincenal', estado: 'cerrado', total_comisiones: 96500 },
    { id: 'per-2', organizacion_id: ORG, nombre: 'Quincena actual', fecha_inicio: hoyISO(), fecha_fin: fechaAtras(-14), tipo_frecuencia: 'quincenal', estado: 'abierto', total_comisiones: 0 },
  ];
  comisiones.forEach(c => { if (new Date(c.fecha) < new Date(fechaAtras(1))) { c.periodo_id = 'per-1'; c.estado = 'pagada'; } else { c.periodo_id = 'per-2'; } });
  periodos_nomina[0].total_comisiones = comisiones.filter(c => c.periodo_id === 'per-1').reduce((a, c) => a + c.monto, 0);
  periodos_nomina[1].total_comisiones = comisiones.filter(c => c.periodo_id === 'per-2').reduce((a, c) => a + c.monto, 0);

  const fidelidad_movimientos: DatosApp['fidelidad_movimientos'] = pagos.slice(0, 6).map((p, i) => ({
    id: `fid-${i}`, organizacion_id: ORG, cliente_id: ordenes.find(o => o.id === p.orden_id)!.cliente_id,
    tipo: 'ganado' as const, puntos: Math.floor(p.monto / 10000), descripcion: 'Puntos por pago', orden_id: p.orden_id, fecha: p.fecha,
  }));

  const membresias = [
    { id: 'mem-1', nombre: 'Básico', precio: 50000, lavados_incluidos: 4, vigencia_dias: 30, descripcion: '4 lavados al mes', activo: true },
    { id: 'mem-2', nombre: 'Premium', precio: 90000, lavados_incluidos: 8, vigencia_dias: 30, descripcion: '8 lavados al mes', activo: true },
    { id: 'mem-3', nombre: 'VIP', precio: 150000, lavados_incluidos: null, vigencia_dias: 30, descripcion: 'Lavados ilimitados', activo: true },
  ].map(m => ({ ...m, organizacion_id: ORG }) as DatosApp['membresias'][number]);

  const membresia_suscripciones: DatosApp['membresia_suscripciones'] = [
    { id: 'subs-1', organizacion_id: ORG, membresia_id: 'mem-2', cliente_id: 'cli-3', fecha_inicio: fechaAtras(10), fecha_fin: fechaAtras(-20), lavados_usados: 3, estado: 'activa' },
  ];

  const reservas: DatosApp['reservas'] = [
    { id: 'res-1', organizacion_id: ORG, codigo: 'RW4K92XA', cliente_id: null, nombre_visitante: 'Camila Rodríguez', telefono_visitante: '3156789012', vehiculo_id: null, servicio_id: 'srv-3', fecha: fechaAtras(-1), hora: '10:30', estado: 'pendiente', notas: 'Camioneta con barro de finca' },
    { id: 'res-2', organizacion_id: ORG, codigo: 'QP7L31MB', cliente_id: 'cli-1', nombre_visitante: null, telefono_visitante: null, vehiculo_id: 'veh-2', servicio_id: 'srv-4', fecha: fechaAtras(-2), hora: '08:00', estado: 'confirmada', notas: null },
  ];

  const whatsapp_plantillas = [
    { codigo: 'recepcion' as const, mensaje: 'Hola {cliente} 👋 Recibimos tu {vehiculo} ({placa}). Te avisaremos cuando esté listo. — {organizacion}' },
    { codigo: 'terminado' as const, mensaje: '🚗 ¡{cliente}, tu {vehiculo} ({placa}) ya está listo para recoger! Te esperamos. — {organizacion}' },
    { codigo: 'promocion' as const, mensaje: 'Hola {cliente} 👋 Hace {dias} días no vemos tu vehículo. Esta semana tienes 15% de descuento en lavado premium. — {organizacion}' },
    { codigo: 'fidelizacion' as const, mensaje: '🎉 ¡{cliente}, completaste {lavados} lavados! Tu próximo lavado tiene descuento. — {organizacion}' },
  ].map((p, i) => ({ id: `wsp-${i + 1}`, organizacion_id: ORG, ...p, activo: true }) as DatosApp['whatsapp_plantillas'][number]);

  const configuraciones = [{ organizacion_id: ORG, meta_diaria: 1000000, puntos_por_monto: 10000, dias_inactivo_ia: 30, whatsapp_pais: '57' }];

  return {
    empleados, clientes, vehiculos, servicios, servicios_adicionales, ordenes, orden_extras,
    orden_fotos: [], metodos_pago, pagos, caja_sesiones, caja_movimientos,
    inventario_productos, inventario_movimientos: [], servicio_consumos,
    periodos_nomina, comisiones, pagos_nomina: [], fidelidad_movimientos,
    membresias, membresia_suscripciones, reservas, whatsapp_plantillas, configuraciones,
  };
}

export function nuevaOrganizacionDemo(): DatosApp {
  const d = datasetDemo();
  // Deja solo lo sembrado por catálogo: sin órdenes/pagos históricos
  d.ordenes = []; d.orden_extras = []; d.pagos = []; d.comisiones = [];
  d.fidelidad_movimientos = []; d.caja_movimientos = []; d.caja_sesiones = [];
  d.membresia_suscripciones = []; d.reservas = []; d.inventario_movimientos = [];
  return d;
}

export function cargarDemo(): DatosApp {
  if (typeof window === 'undefined') return datasetDemo();
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return JSON.parse(raw) as DatosApp;
  } catch { /* ignorar */ }
  const inicial = datasetDemo();
  guardarDemo(inicial);
  return inicial;
}

export function guardarDemo(datos: DatosApp) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* cuota */ }
}

export function resetearDemo(): DatosApp {
  const inicial = datasetDemo();
  guardarDemo(inicial);
  return inicial;
}

export const ORG_DEMO_ID = ORG;
export const EMPLEADO_DEMO = {
  id: 'emp-1', organizacion_id: ORG, auth_user_id: null, nombre: 'Carlos Gómez (Demo)',
  documento: '101020', telefono: '3001112233', email: null, rol: 'admin' as const,
  porcentaje_comision: 30, tipo_pago: 'comision' as const, activo: true, fecha_ingreso: fechaAtras(400),
};

export const nuevaEntidad = (tabla: TablaDatos, organizacionId: string) => ({ id: uid(), organizacion_id: organizacionId });
