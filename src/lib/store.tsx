'use client';

// =====================================================================
// STORE GLOBAL — capa de datos dual:
//  · MODO SUPABASE: auth + PostgreSQL + Storage (usa triggers del schema.sql)
//  · MODO DEMO: dataset local replicando la lógica de negocio en el cliente
// =====================================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteSupabase, supabaseConfigurado } from './supabase';
import { cargarDemo, datasetDemo, EMPLEADO_DEMO, guardarDemo, ORG_DEMO_ID, resetearDemo } from './demo-store';
import { uid, ahoraISO, hoyISO, comprimirImagen } from './format';
import {
  TABLAS_CARGA, type DatosApp, type TablaDatos, type Empleado, type Organizacion,
  type EstadoOrden, type OrdenExtra,
} from './types';

const DATOS_VACIOS: DatosApp = {
  empleados: [], clientes: [], vehiculos: [], servicios: [], servicios_adicionales: [],
  ordenes: [], orden_extras: [], orden_fotos: [], metodos_pago: [], pagos: [],
  caja_sesiones: [], caja_movimientos: [], inventario_productos: [], inventario_movimientos: [],
  servicio_consumos: [], periodos_nomina: [], comisiones: [], pagos_nomina: [],
  fidelidad_movimientos: [], membresias: [], membresia_suscripciones: [], reservas: [],
  whatsapp_plantillas: [], configuraciones: [],
};

export interface EntradaOrden {
  cliente_id: string;
  vehiculo_id: string;
  servicio_id: string;
  empleado_id?: string | null;
  precio_servicio: number;
  extras: Array<{ adicional_id?: string | null; nombre: string; precio: number }>;
  observaciones?: string;
  kilometraje?: number | null;
}

interface AppCtx {
  listo: boolean;
  modo: 'demo' | 'supabase';
  emailSesion: string | null;
  empleado: Empleado | null;
  organizacion: Organizacion | null;
  datos: DatosApp;
  cargandoDatos: boolean;
  necesitaOrganizacion: boolean;
  entrarDemo: () => void;
  salirDemo: () => void;
  iniciarSesion: (email: string, pass: string) => Promise<string | null>;
  registrarse: (email: string, pass: string) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
  crearOrganizacion: (nombre: string) => Promise<string | null>;
  refrescar: () => Promise<void>;
  guardar: (tabla: TablaDatos, item: Record<string, unknown> & { id?: string }) => Promise<string | null>;
  eliminar: (tabla: TablaDatos, id: string) => Promise<void>;
  crearOrden: (entrada: EntradaOrden) => Promise<string | null>;
  cambiarEstadoOrden: (ordenId: string, estado: EstadoOrden) => Promise<string | null>;
  registrarPago: (p: { orden_id: string; metodo_id: string; monto: number; referencia?: string }) => Promise<string | null>;
  abrirCaja: (montoApertura: number) => Promise<string | null>;
  cerrarCaja: (montoReal: number, observaciones: string) => Promise<string | null>;
  subirFoto: (ordenId: string, fase: 'entrada' | 'salida', posicion: string, file: File) => Promise<string | null>;
  eliminarFoto: (fotoId: string) => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp fuera de proveedor');
  return v;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [modo, setModo] = useState<'demo' | 'supabase'>('demo');
  const [sb, setSb] = useState<SupabaseClient | null>(null);
  const [emailSesion, setEmailSesion] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosApp>(DATOS_VACIOS);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // ---------- arranque ----------
  useEffect(() => {
    if (supabaseConfigurado) {
      const c = clienteSupabase();
      if (c) {
        setSb(c);
        setModo('supabase');
        c.auth.getSession().then(({ data }) => {
          setEmailSesion(data.session?.user?.email ?? null);
          setListo(true);
        });
        const { data: sub } = c.auth.onAuthStateChange((_e, s) => {
          setEmailSesion(s?.user?.email ?? null);
        });
        return () => sub.subscription.unsubscribe();
      }
    }
    // Modo demo: recuerda sesión demo en localStorage
    setEmailSesion(localStorage.getItem('carwash_demo_sesion'));
    setListo(true);
  }, []);

  const esDemo = modo === 'demo';

  // ---------- carga de datos ----------
  const refrescar = useCallback(async () => {
    if (esDemo) {
      setDatos(cargarDemo());
      return;
    }
    if (!sb || !emailSesion) return;
    setCargandoDatos(true);
    try {
      const resultado: Record<string, unknown[]> = {};
      await Promise.all(TABLAS_CARGA.map(async t => {
        const { data, error } = await sb.from(t).select('*');
        if (!error) resultado[t] = data ?? [];
      }));
      setDatos(resultado as unknown as DatosApp);
    } finally {
      setCargandoDatos(false);
    }
  }, [sb, emailSesion, esDemo]);

  useEffect(() => { if (listo && emailSesion) refrescar(); }, [listo, emailSesion, refrescar]);

  // ---------- sesión ----------
  const entrarDemo = () => {
    setModo('demo');
    localStorage.setItem('carwash_demo_sesion', 'demo@carwash.app');
    setEmailSesion('demo@carwash.app');
    setDatos(cargarDemo());
  };

  const salirDemo = () => {
    localStorage.removeItem('carwash_demo_sesion');
    setEmailSesion(null);
    setDatos(DATOS_VACIOS);
  };

  const iniciarSesion = async (email: string, pass: string): Promise<string | null> => {
    if (esDemo || !sb) {
      if (!email || !pass) return 'Ingresa correo y contraseña';
      entrarDemo();
      return null;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    return error ? 'Correo o contraseña incorrectos' : null;
  };

  const registrarse = async (email: string, pass: string): Promise<string | null> => {
    if (esDemo || !sb) return 'El registro está disponible conectando Supabase (ver README). Usa el modo demo.';
    const { error } = await sb.auth.signUp({ email, password: pass });
    if (error) return error.message;
    return null;
  };

  const cerrarSesion = async () => {
    if (!esDemo && sb) await sb.auth.signOut();
    if (esDemo) salirDemo();
    setEmailSesion(null);
    setDatos(DATOS_VACIOS);
  };

  // ---------- derivados ----------
  const empleado: Empleado | null = useMemo(() => {
    if (esDemo && emailSesion) return EMPLEADO_DEMO;
    if (!emailSesion || !datos.empleados.length) return null;
    return datos.empleados.find(e => e.email === emailSesion || e.auth_user_id) ?? datos.empleados[0];
  }, [esDemo, emailSesion, datos.empleados]);

  const organizacion: Organizacion | null = useMemo(() => {
    if (esDemo) {
      const d = datos.orden_extras.length >= 0 && Object.keys(datos).length ? {
        id: ORG_DEMO_ID, nombre: 'Lavadero Demo Multivehículos', moneda: 'COP', activa: true,
        direccion: 'Calle 10 #5-25, Bogotá', telefono: '6011234567', nit: '900123456-1',
      } as Organizacion : null;
      return emailSesion ? d : null;
    }
    return emailSesion && datos.empleados.length ? { id: datos.empleados[0].organizacion_id, nombre: 'Mi Lavadero', moneda: 'COP', activa: true } : null;
  }, [esDemo, emailSesion, datos]);

  const orgId = organizacion?.id ?? '';
  const necesitaOrganizacion = Boolean(!esDemo && emailSesion && datos.empleados.length === 0 && !cargandoDatos);

  // ---------- CRUD genérico ----------
  const guardar = useCallback(async (tabla: TablaDatos, item: Record<string, unknown> & { id?: string }): Promise<string | null> => {
    const id = (item.id as string) || uid();
    if (esDemo) {
      setDatos(prev => {
        const lista = [...(prev[tabla] as unknown as Record<string, unknown>[])];
        const idx = lista.findIndex(x => x.id === id);
        const registro = { id, organizacion_id: orgId || ORG_DEMO_ID, ...item, id };
        if (idx >= 0) lista[idx] = { ...lista[idx], ...registro };
        else lista.push(registro);
        const nuevos = { ...prev, [tabla]: lista } as DatosApp;
        guardarDemo(nuevos);
        return nuevos;
      });
      return null;
    }
    if (!sb) return 'Sin conexión';
    const payload = { ...item, id, organizacion_id: orgId };
    if (item.id) {
      const { error } = await sb.from(tabla).update(item).eq('id', item.id);
      if (error) return error.message;
    } else {
      const { error } = await sb.from(tabla).insert(payload);
      if (error) return error.message;
    }
    await refrescar();
    return null;
  }, [esDemo, sb, orgId, refrescar]);

  const eliminar = useCallback(async (tabla: TablaDatos, id: string) => {
    if (esDemo) {
      setDatos(prev => {
        const nuevos = { ...prev, [tabla]: (prev[tabla] as unknown as Record<string, unknown>[]).filter(x => x.id !== id) } as DatosApp;
        guardarDemo(nuevos);
        return nuevos;
      });
      return;
    }
    if (!sb) return;
    const { error } = await sb.from(tabla).delete().eq('id', id);
    if (!error) await refrescar();
  }, [esDemo, sb, refrescar]);

  // ---------- organizacion (onboarding) ----------
  const crearOrganizacion = async (nombre: string): Promise<string | null> => {
    if (esDemo || !sb) return 'Solo disponible con Supabase';
    const { data: org, error: e1 } = await sb.from('organizaciones').insert({ nombre }).select().single();
    if (e1) return e1.message;
    const { data: user } = await sb.auth.getUser();
    const { error: e2 } = await sb.from('empleados').insert({
      organizacion_id: org.id, auth_user_id: user.user?.id, nombre: 'Administrador',
      rol: 'admin', porcentaje_comision: 30, email: user.user?.email,
    });
    if (e2) return e2.message;
    await refrescar();
    return null;
  };

  // ---------- operaciones de negocio ----------
  const crearOrden = async (entrada: EntradaOrden): Promise<string | null> => {
    const ordenId = uid();
    const totalExtras = entrada.extras.reduce((a, e) => a + e.precio, 0);
    const total = entrada.precio_servicio + totalExtras;

    if (esDemo) {
      setDatos(prev => {
        const numero = Math.max(0, ...prev.ordenes.map(o => o.numero)) + 1;
        const org = orgId || ORG_DEMO_ID;
        const orden: DatosApp['ordenes'][number] = {
          id: ordenId, organizacion_id: org, numero, cliente_id: entrada.cliente_id,
          vehiculo_id: entrada.vehiculo_id, servicio_id: entrada.servicio_id,
          empleado_id: entrada.empleado_id ?? null, estado: 'recibido',
          precio_servicio: entrada.precio_servicio, total_extras: totalExtras, total,
          observaciones: entrada.observaciones ?? null, kilometraje: entrada.kilometraje ?? null,
          fecha_entrada: ahoraISO(), fecha_terminado: null, fecha_entregado: null,
        };
        const extras: OrdenExtra[] = entrada.extras.map((e, i) => ({
          id: uid(), organizacion_id: org, orden_id: ordenId, adicional_id: e.adicional_id ?? null,
          nombre: e.nombre, precio: e.precio,
        }));
        const nuevos = { ...prev, ordenes: [...prev.ordenes, orden], orden_extras: [...prev.orden_extras, ...extras] };
        guardarDemo(nuevos);
        return nuevos;
      });
      return ordenId;
    }
    if (!sb) return 'Sin conexión';
    const { data: creada, error } = await sb.from('ordenes').insert({
      cliente_id: entrada.cliente_id, vehiculo_id: entrada.vehiculo_id, servicio_id: entrada.servicio_id,
      empleado_id: entrada.empleado_id ?? null, estado: 'recibido', precio_servicio: entrada.precio_servicio,
      total_extras: totalExtras, total, observaciones: entrada.observaciones ?? null,
      kilometraje: entrada.kilometraje ?? null,
    }).select().single();
    if (error) return error.message;
    const idReal = creada.id as string;
    if (entrada.extras.length && idReal) {
      await sb.from('orden_extras').insert(entrada.extras.map(e => ({
        organizacion_id: orgId, orden_id: idReal, adicional_id: e.adicional_id ?? null,
        nombre: e.nombre, precio: e.precio,
      })));
    }
    await refrescar();
    return idReal ?? null;
  };

  const cambiarEstadoOrden = async (ordenId: string, estado: EstadoOrden): Promise<string | null> => {
    if (esDemo) {
      setDatos(prev => {
        const org = orgId || ORG_DEMO_ID;
        const orden = prev.ordenes.find(o => o.id === ordenId);
        if (!orden) return prev;
        const estadosAvance = ['terminado', 'pagado', 'entregado'];
        const yaCompletada = estadosAvance.includes(orden.estado);
        const ordenes = prev.ordenes.map(o => o.id === ordenId ? {
          ...o, estado,
          fecha_terminado: estadosAvance.includes(estado) && !o.fecha_terminado ? ahoraISO() : o.fecha_terminado,
          fecha_entregado: estado === 'entregado' ? ahoraISO() : o.fecha_entregado,
        } : o);
        let comisiones = [...prev.comisiones];
        let inventario_productos = [...prev.inventario_productos];
        let inventario_movimientos = [...prev.inventario_movimientos];
        let clientes = [...prev.clientes];
        let vehiculos = [...prev.vehiculos];
        let fidelidad_movimientos = [...prev.fidelidad_movimientos];

        if (!yaCompletada && estadosAvance.includes(estado)) {
          // comisión automática
          if (orden.empleado_id) {
            const emp = prev.empleados.find(e => e.id === orden.empleado_id);
            if (emp && emp.porcentaje_comision > 0 && !comisiones.some(c => c.orden_id === ordenId)) {
              comisiones.push({
                id: uid(), organizacion_id: org, orden_id: ordenId, empleado_id: emp.id, periodo_id: null,
                base: orden.total, porcentaje: emp.porcentaje_comision,
                monto: Math.round(orden.total * emp.porcentaje_comision) / 100, estado: 'pendiente', fecha: ahoraISO(),
              });
            }
          }
          // descuento de inventario (receta del servicio)
          for (const c of prev.servicio_consumos.filter(x => x.servicio_id === orden.servicio_id)) {
            const prod = inventario_productos.find(p => p.id === c.producto_id);
            if (prod) {
              prod.stock = Number(prod.stock) - Number(c.cantidad);
              inventario_movimientos.push({
                id: uid(), organizacion_id: org, producto_id: prod.id, tipo: 'salida',
                cantidad: c.cantidad, orden_id: ordenId, notas: `Consumo automático — orden #${orden.numero}`, fecha: ahoraISO(),
              });
            }
          }
        }
        if (estado === 'pagado' && orden.estado !== 'pagado') {
          // estadísticas de vehículo y cliente
          vehiculos = vehiculos.map(v => v.id === orden.vehiculo_id ? {
            ...v, lavados_acumulados: v.lavados_acumulados + 1,
            ultimo_lavado: hoyISO(), total_gastado: v.total_gastado + orden.total,
          } : v);
          clientes = clientes.map(c => c.id === orden.cliente_id ? {
            ...c, total_gastado: c.total_gastado + orden.total, ultima_visita: ahoraISO(),
          } : c);
        }
        const nuevos: DatosApp = { ...prev, ordenes, comisiones, inventario_productos, inventario_movimientos, clientes, vehiculos, fidelidad_movimientos };
        guardarDemo(nuevos);
        return nuevos;
      });
      return null;
    }
    if (!sb) return 'Sin conexión';
    const { error } = await sb.from('ordenes').update({ estado }).eq('id', ordenId);
    if (error) return error.message;
    await refrescar();
    return null;
  };

  const registrarPago = async (p: { orden_id: string; metodo_id: string; monto: number; referencia?: string }): Promise<string | null> => {
    if (esDemo) {
      setDatos(prev => {
        const org = orgId || ORG_DEMO_ID;
        const orden = prev.ordenes.find(o => o.id === p.orden_id);
        const pagos = [...prev.pagos, { id: uid(), organizacion_id: org, orden_id: p.orden_id, metodo_id: p.metodo_id, monto: p.monto, referencia: p.referencia ?? null, fecha: ahoraISO() }];
        const ordenes = orden && ['recibido', 'en_proceso', 'terminado'].includes(orden.estado)
          ? prev.ordenes.map(o => o.id === p.orden_id ? { ...o, estado: 'pagado' as EstadoOrden, fecha_terminado: o.fecha_terminado ?? ahoraISO() } : o)
          : prev.ordenes;
        let clientes = prev.clientes;
        let fidelidad = prev.fidelidad_movimientos;
        if (orden) {
          const cfg = prev.configuraciones[0];
          const factor = cfg?.puntos_por_monto ?? 10000;
          const pts = Math.floor(p.monto / factor);
          clientes = prev.clientes.map(c => c.id === orden.cliente_id ? {
            ...c, total_gastado: c.total_gastado + p.monto, ultima_visita: ahoraISO(), puntos: c.puntos + pts,
          } : c);
          if (pts > 0) fidelidad = [...fidelidad, { id: uid(), organizacion_id: org, cliente_id: orden.cliente_id, tipo: 'ganado' as const, puntos: pts, descripcion: `Puntos por pago orden #${orden.numero}`, orden_id: orden.id, fecha: ahoraISO() }];
        }
        const nuevos: DatosApp = { ...prev, pagos, ordenes, clientes, fidelidad_movimientos: fidelidad };
        guardarDemo(nuevos);
        return nuevos;
      });
      return null;
    }
    if (!sb) return 'Sin conexión';
    const { error } = await sb.from('pagos').insert({
      organizacion_id: orgId, orden_id: p.orden_id, metodo_id: p.metodo_id,
      monto: p.monto, referencia: p.referencia ?? null,
    });
    if (error) return error.message;
    await refrescar();
    return null;
  };

  const abrirCaja = async (montoApertura: number): Promise<string | null> => {
    return guardar('caja_sesiones', {
      fecha: hoyISO(), monto_apertura: montoApertura, estado: 'abierta',
      empleado_id: empleado?.id ?? null, abierta_at: ahoraISO(),
    });
  };

  const cerrarCaja = async (montoReal: number, observaciones: string): Promise<string | null> => {
    const sesion = datos.caja_sesiones.find(c => c.estado === 'abierta');
    if (!sesion) return 'No hay caja abierta';
    const movs = datos.caja_movimientos.filter(m => m.sesion_id === sesion.id);
    const entradas = movs.filter(m => m.tipo === 'entrada').reduce((a, m) => a + m.monto, 0);
    const salidas = movs.filter(m => m.tipo === 'salida').reduce((a, m) => a + m.monto, 0);
    const esperado = sesion.monto_apertura + entradas - salidas;
    const upd: Record<string, unknown> = {
      id: sesion.id, estado: 'cerrada', monto_cierre: montoReal,
      monto_esperado: esperado, diferencia: montoReal - esperado,
      observaciones, cerrada_at: ahoraISO(),
    };
    return guardar('caja_sesiones', upd);
  };

  const subirFoto = async (ordenId: string, fase: 'entrada' | 'salida', posicion: string, file: File): Promise<string | null> => {
    const dataUrl = await comprimirImagen(file);
    if (esDemo || !sb) {
      const r = await guardar('orden_fotos', { orden_id: ordenId, fase, posicion, url: dataUrl });
      return r;
    }
    const nombre = `${orgId}/${ordenId}/${fase}-${posicion}-${Date.now()}.jpg`;
    const blob = await (await fetch(dataUrl)).blob();
    const { error } = await sb.storage.from('fotos-vehiculos').upload(nombre, blob, { contentType: 'image/jpeg' });
    if (error) return error.message;
    const { data: pub } = sb.storage.from('fotos-vehiculos').getPublicUrl(nombre);
    await guardar('orden_fotos', { orden_id: ordenId, fase, posicion, url: pub.publicUrl });
    return null;
  };

  const eliminarFoto = async (fotoId: string) => { await eliminar('orden_fotos', fotoId); };

  const value: AppCtx = {
    listo, modo, emailSesion, empleado, organizacion, datos, cargandoDatos, necesitaOrganizacion,
    entrarDemo, salirDemo, iniciarSesion, registrarse, cerrarSesion, crearOrganizacion, refrescar,
    guardar, eliminar, crearOrden, cambiarEstadoOrden, registrarPago,
    abrirCaja, cerrarCaja, subirFoto, eliminarFoto,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { datasetDemo, resetearDemo };
