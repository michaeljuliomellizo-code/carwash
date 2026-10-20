'use client';

// Comisiones — cálculo automático por empleado según el % configurado.

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Encabezado, TarjetaKPI, TablaSimple, Vacio } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFecha } from '@/lib/format';
import { Percent, Users, TrendingUp } from 'lucide-react';

export default function Comisiones() {
  const { datos } = useApp();
  const [filtroEmp, setFiltroEmp] = useState('todos');

  const porEmpleado = useMemo(() => {
    const mapa = new Map<string, { total: number; servicios: number; pendiente: number }>();
    for (const c of datos.comisiones) {
      if (filtroEmp !== 'todos' && c.empleado_id !== filtroEmp) continue;
      const acc = mapa.get(c.empleado_id) ?? { total: 0, servicios: 0, pendiente: 0 };
      acc.total += c.monto;
      acc.servicios += 1;
      if (c.estado === 'pendiente') acc.pendiente += c.monto;
      mapa.set(c.empleado_id, acc);
    }
    return [...mapa.entries()]
      .map(([empId, v]) => ({ empleado: datos.empleados.find(e => e.id === empId), ...v }))
      .filter(x => x.empleado)
      .sort((a, b) => b.total - a.total);
  }, [datos.comisiones, datos.empleados, filtroEmp]);

  const totalGeneral = porEmpleado.reduce((a, e) => a + e.total, 0);
  const pendienteGeneral = porEmpleado.reduce((a, e) => a + e.pendiente, 0);

  const comisionesDet = useMemo(() =>
    [...datos.comisiones]
      .filter(c => filtroEmp === 'todos' || c.empleado_id === filtroEmp)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 50),
    [datos.comisiones, filtroEmp]);

  return (
    <div>
      <Encabezado titulo="Comisiones" subtitulo="Cálculo automático según el % de cada empleado" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <TarjetaKPI titulo="Comisiones generadas" valor={fmtCOP(totalGeneral)} icono={<Percent className="h-5 w-5" />} tono="teal" />
        <TarjetaKPI titulo="Por pagar" valor={fmtCOP(pendienteGeneral)} icono={<TrendingUp className="h-5 w-5" />} tono="amber" />
        <TarjetaKPI titulo="Empleados con comisión" valor={String(porEmpleado.length)} icono={<Users className="h-5 w-5" />} tono="sky" />
      </div>

      <div className="mb-4 max-w-xs">
        <Select value={filtroEmp} onValueChange={setFiltroEmp}>
          <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los empleados</SelectItem>
            {datos.empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {porEmpleado.map(e => (
          <Card key={e.empleado!.id} className="border-slate-200/80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{e.empleado!.nombre}</p>
                  <p className="text-xs text-slate-500">Comisión del {e.empleado!.porcentaje_comision}% · {e.servicios} servicios</p>
                </div>
                <Badge className="bg-teal-100 text-teal-800 border border-teal-200 text-sm">{fmtCOP(e.total)}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Pendiente de pago</span>
                <span className="font-semibold text-amber-600 tabular-nums">{fmtCOP(e.pendiente)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {porEmpleado.length === 0 && <Vacio mensaje="Sin comisiones registradas aún. Se generan automáticamente al completar órdenes con empleado asignado." />}
      </div>

      <p className="text-sm font-semibold text-slate-700 mb-2">Detalle</p>
      <TablaSimple encabezados={['Fecha', 'Empleado', 'Orden', 'Base', '%', 'Comisión', 'Estado']}>
        {comisionesDet.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">Sin registros</td></tr>
        ) : comisionesDet.map(c => (
          <tr key={c.id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-slate-500 text-sm">{fmtFecha(c.fecha)}</td>
            <td className="px-4 py-2.5 font-medium text-slate-800">{datos.empleados.find(e => e.id === c.empleado_id)?.nombre ?? '—'}</td>
            <td className="px-4 py-2.5 text-teal-700 font-semibold">
              #{String(datos.ordenes.find(o => o.id === c.orden_id)?.numero ?? '—').padStart(4, '0')}
            </td>
            <td className="px-4 py-2.5 tabular-nums">{fmtCOP(c.base)}</td>
            <td className="px-4 py-2.5 text-slate-500">{c.porcentaje}%</td>
            <td className="px-4 py-2.5 font-bold tabular-nums text-teal-700">{fmtCOP(c.monto)}</td>
            <td className="px-4 py-2.5">
              <Badge variant="outline" className={c.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                {c.estado}
              </Badge>
            </td>
          </tr>
        ))}
      </TablaSimple>
    </div>
  );
}
