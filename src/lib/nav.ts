// Definición de módulos de navegación con permisos por rol

import {
  LayoutDashboard, Users, Car, ClipboardList, Sparkles, PlusCircle, UserCog, Percent,
  Wallet, CreditCard, Package, Beaker, MessageCircle, Gift, IdCard, CalendarClock,
  BarChart3, Banknote, Bot, Settings, type LucideIcon,
} from 'lucide-react';
import type { Rol } from './types';

export interface Modulo {
  id: string;
  etiqueta: string;
  icono: LucideIcon;
  grupo: 'Principal' | 'Operación' | 'Comercial' | 'Finanzas' | 'Inventario' | 'Inteligencia';
  roles: Rol[];
  descripcion: string;
}

export const MODULOS: Modulo[] = [
  { id: 'dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard, grupo: 'Principal', roles: ['admin', 'supervisor', 'cajero', 'lavador'], descripcion: 'Resumen del día' },
  { id: 'ordenes', etiqueta: 'Órdenes', icono: ClipboardList, grupo: 'Principal', roles: ['admin', 'supervisor', 'cajero', 'lavador'], descripcion: 'Recepción y estados' },
  { id: 'clientes', etiqueta: 'Clientes', icono: Users, grupo: 'Principal', roles: ['admin', 'supervisor', 'cajero'], descripcion: 'Fichas e historial' },
  { id: 'vehiculos', etiqueta: 'Vehículos', icono: Car, grupo: 'Principal', roles: ['admin', 'supervisor', 'cajero'], descripcion: 'Flota registrada' },

  { id: 'servicios', etiqueta: 'Servicios y tarifas', icono: Sparkles, grupo: 'Operación', roles: ['admin', 'supervisor'], descripcion: 'Catálogo de precios' },
  { id: 'extras', etiqueta: 'Servicios adicionales', icono: PlusCircle, grupo: 'Operación', roles: ['admin', 'supervisor'], descripcion: 'Extras del ticket' },
  { id: 'empleados', etiqueta: 'Empleados', icono: UserCog, grupo: 'Operación', roles: ['admin', 'supervisor'], descripcion: 'Equipo y roles' },

  { id: 'membresias', etiqueta: 'Membresías', icono: IdCard, grupo: 'Comercial', roles: ['admin', 'supervisor', 'cajero'], descripcion: 'Ingresos recurrentes' },
  { id: 'fidelizacion', etiqueta: 'Fidelización', icono: Gift, grupo: 'Comercial', roles: ['admin', 'supervisor', 'cajero'], descripcion: 'Puntos y recompensas' },
  { id: 'reservas', etiqueta: 'Reservas', icono: CalendarClock, grupo: 'Comercial', roles: ['admin', 'supervisor', 'cajero'], descripcion: 'Citas online' },
  { id: 'whatsapp', etiqueta: 'WhatsApp', icono: MessageCircle, grupo: 'Comercial', roles: ['admin', 'supervisor'], descripcion: 'Mensajes automáticos' },

  { id: 'caja', etiqueta: 'Caja', icono: Wallet, grupo: 'Finanzas', roles: ['admin', 'cajero'], descripcion: 'Apertura y arqueo' },
  { id: 'pagos', etiqueta: 'Métodos de pago', icono: CreditCard, grupo: 'Finanzas', roles: ['admin', 'supervisor', 'cajero'], descripcion: 'Cobros por canal' },
  { id: 'comisiones', etiqueta: 'Comisiones', icono: Percent, grupo: 'Finanzas', roles: ['admin', 'supervisor'], descripcion: 'Ganancias del equipo' },
  { id: 'nomina', etiqueta: 'Nómina / Periodos', icono: Banknote, grupo: 'Finanzas', roles: ['admin'], descripcion: 'Ciclos de pago' },

  { id: 'inventario', etiqueta: 'Inventario', icono: Package, grupo: 'Inventario', roles: ['admin', 'supervisor'], descripcion: 'Stock y alertas' },
  { id: 'consumos', etiqueta: 'Consumo por servicio', icono: Beaker, grupo: 'Inventario', roles: ['admin', 'supervisor'], descripcion: 'Recetas automáticas' },

  { id: 'reportes', etiqueta: 'Reportes', icono: BarChart3, grupo: 'Inteligencia', roles: ['admin', 'supervisor', 'cajero'], descripcion: 'Ventas y rentabilidad' },
  { id: 'ia', etiqueta: 'Asistente IA', icono: Bot, grupo: 'Inteligencia', roles: ['admin', 'supervisor'], descripcion: 'Predicciones y reactivación' },
  { id: 'configuracion', etiqueta: 'Configuración', icono: Settings, grupo: 'Inteligencia', roles: ['admin'], descripcion: 'Organización y parámetros' },
];

export const GRUPOS: Array<Modulo['grupo']> = ['Principal', 'Operación', 'Comercial', 'Finanzas', 'Inventario', 'Inteligencia'];
