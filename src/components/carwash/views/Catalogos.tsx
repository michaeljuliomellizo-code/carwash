'use client';

// Catálogos simples basados en la vista genérica

import CatalogoView from '@/components/carwash/CatalogoView';
import { fmtCOP } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import type { Servicio, ServicioAdicional, MetodoPago, Membresia } from '@/lib/types';

export function VistaServicios() {
  return (
    <CatalogoView<Servicio>
      tabla="servicios"
      titulo="Servicios y tarifas"
      subtitulo="Precios diferenciados por tipo de vehículo"
      textoBoton="Nuevo servicio"
      vacio="Crea tu primer servicio: lavado básico, completo, premium…"
      campos={[
        { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, placeholder: 'Lavado premium' },
        { key: 'tipo_vehiculo', label: 'Tipo de vehículo', tipo: 'select', requerido: true, opciones: [
          { value: 'carro', label: '🚗 Carro' }, { value: 'moto', label: '🏍️ Moto' }, { value: 'ambos', label: 'Ambos' },
        ] },
        { key: 'precio', label: 'Precio (COP)', tipo: 'moneda', requerido: true, placeholder: '40000' },
        { key: 'duracion_min', label: 'Duración (min)', tipo: 'numero', placeholder: '60' },
        { key: 'descripcion', label: 'Descripción', tipo: 'texto', placeholder: 'Incluye cera y brillado' },
        { key: 'activo', label: 'Activo', tipo: 'switch' },
      ]}
      columnas={[
        { key: 'nombre', label: 'Servicio', render: s => <span className="font-medium text-slate-800">{s.nombre}</span> },
        { key: 'tipo_vehiculo', label: 'Tipo', render: s => s.tipo_vehiculo === 'moto' ? '🏍️ Moto' : s.tipo_vehiculo === 'carro' ? '🚗 Carro' : 'Ambos' },
        { key: 'precio', label: 'Precio', render: s => <span className="font-semibold tabular-nums text-teal-700">{fmtCOP(s.precio)}</span> },
        { key: 'duracion_min', label: 'Duración', render: s => `${s.duracion_min} min` },
        { key: 'activo', label: 'Estado', render: s => s.activo
          ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Activo</Badge>
          : <Badge variant="outline">Inactivo</Badge> },
      ]}
    />
  );
}

export function VistaExtras() {
  return (
    <CatalogoView<ServicioAdicional>
      tabla="servicios_adicionales"
      titulo="Servicios adicionales"
      subtitulo="Extras que aumentan el ticket promedio de cada orden"
      textoBoton="Nuevo extra"
      vacio="Agrega extras como aspirado, encerado, polichado, tratamiento cerámico…"
      campos={[
        { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, placeholder: 'Encerado' },
        { key: 'precio', label: 'Precio (COP)', tipo: 'moneda', requerido: true, placeholder: '15000' },
        { key: 'activo', label: 'Activo', tipo: 'switch' },
      ]}
      columnas={[
        { key: 'nombre', label: 'Extra', render: s => <span className="font-medium text-slate-800">{s.nombre}</span> },
        { key: 'precio', label: 'Precio', render: s => <span className="font-semibold tabular-nums text-teal-700">{fmtCOP(s.precio)}</span> },
        { key: 'activo', label: 'Estado', render: s => s.activo
          ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Activo</Badge>
          : <Badge variant="outline">Inactivo</Badge> },
      ]}
    />
  );
}

export function VistaMetodosPago() {
  return (
    <CatalogoView<MetodoPago>
      tabla="metodos_pago"
      titulo="Métodos de pago"
      subtitulo="Canales de cobro: efectivo, tarjeta, transferencia, Nequi, Daviplata…"
      textoBoton="Nuevo método"
      vacio="Configura los métodos de pago que acepta el lavadero."
      campos={[
        { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, placeholder: 'Nequi' },
        { key: 'tipo', label: 'Categoría', tipo: 'select', requerido: true, opciones: [
          { value: 'efectivo', label: '💵 Efectivo' }, { value: 'tarjeta', label: '💳 Tarjeta' },
          { value: 'transferencia', label: '🏦 Transferencia' }, { value: 'nequi', label: '📱 Nequi' },
          { value: 'daviplata', label: '📱 Daviplata' }, { value: 'otros', label: 'Otros' },
        ] },
        { key: 'activo', label: 'Activo', tipo: 'switch' },
      ]}
      columnas={[
        { key: 'nombre', label: 'Método', render: m => <span className="font-medium text-slate-800">{m.nombre}</span> },
        { key: 'tipo', label: 'Categoría', render: m => <span className="capitalize">{m.tipo}</span> },
        { key: 'activo', label: 'Estado', render: m => m.activo
          ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Activo</Badge>
          : <Badge variant="outline">Inactivo</Badge> },
      ]}
    />
  );
}

export function VistaMembresias() {
  return (
    <CatalogoView<Membresia>
      tabla="membresias"
      titulo="Membresías"
      subtitulo="Ingresos recurrentes: Básico, Premium y VIP"
      textoBoton="Nueva membresía"
      vacio="Crea planes de membresía para generar ingresos recurrentes."
      campos={[
        { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, placeholder: 'Premium' },
        { key: 'precio', label: 'Precio mensual (COP)', tipo: 'moneda', requerido: true, placeholder: '90000' },
        { key: 'lavados_incluidos', label: 'Lavados incluidos (vacío = ilimitados)', tipo: 'numero', placeholder: '8' },
        { key: 'vigencia_dias', label: 'Vigencia (días)', tipo: 'numero', requerido: true, placeholder: '30' },
        { key: 'descripcion', label: 'Descripción', tipo: 'texto', placeholder: '8 lavados al mes' },
        { key: 'activo', label: 'Activa', tipo: 'switch' },
      ]}
      columnas={[
        { key: 'nombre', label: 'Plan', render: m => <span className="font-medium text-slate-800">
          {m.nombre === 'VIP' ? '🥇' : m.nombre === 'Premium' ? '🥈' : m.nombre === 'Básico' ? '🥉' : '🎫'} {m.nombre}
        </span> },
        { key: 'precio', label: 'Precio', render: m => <span className="font-semibold tabular-nums text-teal-700">{fmtCOP(m.precio)}/mes</span> },
        { key: 'lavados_incluidos', label: 'Lavados', render: m => m.lavados_incluidos ? `${m.lavados_incluidos} lavados` : '♾️ Ilimitados' },
        { key: 'vigencia_dias', label: 'Vigencia', render: m => `${m.vigencia_dias} días` },
        { key: 'activo', label: 'Estado', render: m => m.activo
          ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Activa</Badge>
          : <Badge variant="outline">Inactiva</Badge> },
      ]}
    />
  );
}
