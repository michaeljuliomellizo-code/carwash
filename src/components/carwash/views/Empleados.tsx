'use client';

// Empleados — equipo con roles, % de comisión y estado.

import CatalogoView from '@/components/carwash/CatalogoView';
import { Badge } from '@/components/ui/badge';
import { fmtFecha, fmtCOP } from '@/lib/format';
import type { Empleado } from '@/lib/types';

const COLOR_ROL: Record<string, string> = {
  admin: 'bg-slate-800 text-white border-slate-800',
  supervisor: 'bg-sky-100 text-sky-800 border-sky-200',
  cajero: 'bg-violet-100 text-violet-800 border-violet-200',
  lavador: 'bg-teal-100 text-teal-800 border-teal-200',
};

export default function Empleados() {
  return (
    <CatalogoView<Empleado>
      tabla="empleados"
      titulo="Empleados"
      subtitulo="Equipo de trabajo con roles y porcentaje de comisión"
      textoBoton="Nuevo empleado"
      vacio="Agrega al equipo: administrador, supervisor, cajero y lavadores."
      campos={[
        { key: 'nombre', label: 'Nombre completo', tipo: 'texto', requerido: true, placeholder: 'Carlos Gómez' },
        { key: 'rol', label: 'Rol', tipo: 'select', requerido: true, opciones: [
          { value: 'admin', label: '👑 Administrador (acceso total)' },
          { value: 'supervisor', label: '🧭 Supervisor (órdenes, empleados y reportes)' },
          { value: 'cajero', label: '💵 Cajero (cobros, caja y consultas)' },
          { value: 'lavador', label: '🧽 Lavador (sus órdenes asignadas)' },
        ] },
        { key: 'documento', label: 'Documento', tipo: 'texto', placeholder: '1010202345' },
        { key: 'telefono', label: 'Teléfono', tipo: 'texto', placeholder: '3001234567' },
        { key: 'porcentaje_comision', label: '% de comisión por servicio', tipo: 'numero', requerido: true, placeholder: '30' },
        { key: 'fecha_ingreso', label: 'Fecha de ingreso', tipo: 'texto', placeholder: '2024-01-15' },
        { key: 'activo', label: 'Activo', tipo: 'switch' },
      ]}
      porDefecto={{ fecha_ingreso: new Date().toISOString().slice(0, 10) }}
      columnas={[
        { key: 'nombre', label: 'Empleado', render: e => (
          <div>
            <p className="font-medium text-slate-800">{e.nombre}</p>
            <p className="text-xs text-slate-400">{e.documento ?? ''} · Ingreso: {fmtFecha(e.fecha_ingreso)}</p>
          </div>
        ) },
        { key: 'rol', label: 'Rol', render: e => (
          <Badge variant="outline" className={`${COLOR_ROL[e.rol]} capitalize`}>{e.rol}</Badge>
        ) },
        { key: 'porcentaje_comision', label: 'Comisión', render: e => e.porcentaje_comision > 0
          ? <span className="font-semibold text-teal-700">{e.porcentaje_comision}% ({fmtCOP(25000 * e.porcentaje_comision / 100)} por lavado de $25.000)</span>
          : <span className="text-slate-400">—</span> },
        { key: 'telefono', label: 'Teléfono', render: e => e.telefono ?? '—' },
        { key: 'activo', label: 'Estado', render: e => e.activo
          ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Activo</Badge>
          : <Badge variant="outline">Inactivo</Badge> },
      ]}
    />
  );
}
