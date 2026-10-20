'use client';

// Reportes — ventas por periodo, top servicios, segmentación de clientes y rentabilidad.

import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Encabezado, TarjetaKPI, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtNum } from '@/lib/format';
import { TrendingUp, Users, Car, Percent } from 'lucide-react';

const COLORES = ['#0d9488', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#f97316'];

export default function Reportes() {
  const { datos } = useApp();
  const [periodo, setPeriodo] = useState('mes');

  const rango = useMemo(() => {
    const dias = periodo === 'hoy' ? 1 : periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 365;
    const desde = new Date(Date.now() - dias * 86400000);
    return { desde, iso: desde.toISOString().slice(0, 10) };
  }, [periodo]);

  const enRango = (f: string) => f.slice(0, 10) >= rango.iso;

  const rep = useMemo(() => {
    const ordenes = datos.ordenes.filter(o => enRango(o.fecha_entrada));
    const pagos = datos.pagos.filter(p => enRango(p.fecha));
    const ingresos = pagos.reduce((a, p) => a + p.monto, 0);

    // costo estimado por insumos de cada orden
    const costos = ordenes.reduce((acc, o) => {
      const recetas = datos.servicio_consumos.filter(r => r.servicio_id === o.servicio_id);
      const costo = recetas.reduce((a, r) => {
        const p = datos.inventario_productos.find(x => x.id === r.producto_id);
        return a + Number(r.cantidad) * Number(p?.costo_unitario ?? 0);
      }, 0);
      return acc + costo;
    }, 0);

    // top servicios
    const conteoServicios = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();
    for (const o of ordenes) {
      const s = datos.servicios.find(x => x.id === o.servicio_id);
      if (!s) continue;
      const acc = conteoServicios.get(s.id) ?? { nombre: `${s.nombre} (${s.tipo_vehiculo})`, cantidad: 0, ingresos: 0 };
      acc.cantidad += 1; acc.ingresos += o.total;
      conteoServicios.set(s.id, acc);
    }
    const topServicios = [...conteoServicios.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 7);

    // empleados
    const porEmpleado = new Map<string, { servicios: number; ventas: number }>();
    for (const o of ordenes) {
      if (!o.empleado_id) continue;
      const acc = porEmpleado.get(o.empleado_id) ?? { servicios: 0, ventas: 0 };
      acc.servicios += 1; acc.ventas += o.total;
      porEmpleado.set(o.empleado_id, acc);
    }

    // clientes: nuevos (creados en rango según primera orden), recurrentes, inactivos
    const hoy = new Date().toISOString().slice(0, 10);
    const nuevos = datos.clientes.filter(c => c.ultima_visita && c.ultima_visita.slice(0, 10) >= rango.iso && datos.ordenes.filter(o => o.cliente_id === c.id).length <= 2).length;
    const recurrentes = datos.clientes.filter(c => datos.ordenes.filter(o => o.cliente_id === c.id).length > 2).length;
    const inactivos = datos.clientes.filter(c => !c.ultima_visita || c.ultima_visita.slice(0, 10) < new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).length;

    // carros vs motos
    let carros = 0, motos = 0;
    for (const o of ordenes) {
      const v = datos.vehiculos.find(x => x.id === o.vehiculo_id);
      if (v?.tipo === 'carro') carros++; else if (v?.tipo === 'moto') motos++;
    }

    return { ordenes, ingresos, costos, topServicios, porEmpleado, nuevos, recurrentes, inactivos, carros, motos };
  }, [datos, rango.iso]);

  const utilidad = rep.ingresos - rep.costos;
  const margen = rep.ingresos > 0 ? Math.round((utilidad / rep.ingresos) * 100) : 0;

  const serieVentas = useMemo(() => {
    const dias = periodo === 'hoy' ? 1 : periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 12;
    if (periodo === 'anio') {
      return Array.from({ length: 12 }, (_, i) => {
        const m = new Date(); m.setMonth(m.getMonth() - (11 - i));
        const key = m.toISOString().slice(0, 7);
        const total = datos.pagos.filter(p => p.fecha.slice(0, 7) === key).reduce((a, p) => a + p.monto, 0);
        return { nombre: m.toLocaleDateString('es-CO', { month: 'short' }), ventas: total };
      });
    }
    const n = Math.max(7, dias);
    return Array.from({ length: n }, (_, i) => {
      const f = new Date(Date.now() - (n - 1 - i) * 86400000);
      const iso = f.toISOString().slice(0, 10);
      const total = datos.pagos.filter(p => p.fecha.slice(0, 10) === iso).reduce((a, p) => a + p.monto, 0);
      return { nombre: f.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }), ventas: total };
    });
  }, [datos.pagos, periodo]);

  const datosPie = [
    { name: 'Carros', value: rep.carros }, { name: 'Motos', value: rep.motos },
  ];

  return (
    <div>
      <Encabezado titulo="Reportes" subtitulo="Ventas, servicios, clientes y rentabilidad del negocio"
        accion={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-44 min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="anio">Este año</SelectItem>
            </SelectContent>
          </Select>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <TarjetaKPI titulo="Ingresos" valor={fmtCOP(rep.ingresos)} icono={<TrendingUp className="h-5 w-5" />} tono="emerald" detalle={`${rep.ordenes.length} órdenes`} />
        <TarjetaKPI titulo="Costos (insumos)" valor={fmtCOP(rep.costos)} icono={<Percent className="h-5 w-5" />} tono="amber" detalle="Estimado por recetas" />
        <TarjetaKPI titulo="Utilidad aproximada" valor={fmtCOP(utilidad)} icono={<TrendingUp className="h-5 w-5" />} tono="teal" detalle={`Margen: ${margen}%`} />
        <TarjetaKPI titulo="Vehículos atendidos" valor={fmtNum(rep.carros + rep.motos)} icono={<Car className="h-5 w-5" />} tono="sky" detalle={`${rep.carros} carros · ${rep.motos} motos`} />
      </div>

      <Card className="border-slate-200/80 mb-5">
        <CardHeader className="pb-2"><CardTitle className="text-base">📈 Evolución de ingresos</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serieVentas} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                <Tooltip formatter={v => [fmtCOP(Number(v)), 'Ventas']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="ventas" fill="#0d9488" radius={[5, 5, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base">🏆 Servicios más vendidos</CardTitle></CardHeader>
          <CardContent>
            {rep.topServicios.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos en el periodo</p>
            ) : (
              <div className="space-y-2">
                {rep.topServicios.map((s, i) => (
                  <div key={s.nombre} className="flex items-center gap-3">
                    <span className="text-sm w-5">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.nombre}</p>
                      <p className="text-xs text-slate-400">{s.cantidad} veces · {fmtCOP(s.ingresos)}</p>
                    </div>
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">{s.cantidad}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-teal-600" /> Clientes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Segmento nombre="Nuevos (primeros lavados)" valor={rep.nuevos} color="bg-sky-500" />
            <Segmento nombre="Recurrentes (+2 lavados)" valor={rep.recurrentes} color="bg-teal-500" />
            <Segmento nombre="Inactivos (+30 días)" valor={rep.inactivos} color="bg-rose-500" />
            <div className="h-44 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datosPie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    <Cell fill="#0d9488" /><Cell fill="#f59e0b" />
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base">👷 Rendimiento por empleado</CardTitle></CardHeader>
          <CardContent>
            {[...rep.porEmpleado.entries()].length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos en el periodo</p>
            ) : (
              <TablaSimple encabezados={['Empleado', 'Servicios', 'Ventas']}>
                {[...rep.porEmpleado.entries()].map(([id, v]) => (
                  <tr key={id}>
                    <td className="px-2 py-2 font-medium text-slate-800 text-sm">{datos.empleados.find(e => e.id === id)?.nombre ?? '—'}</td>
                    <td className="px-2 py-2 tabular-nums">{v.servicios}</td>
                    <td className="px-2 py-2 font-semibold tabular-nums text-teal-700 text-sm">{fmtCOP(v.ventas)}</td>
                  </tr>
                ))}
              </TablaSimple>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-teal-200 bg-teal-50/40">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-teal-900 mb-2">💰 Rentabilidad del periodo</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-white border border-teal-100 px-4 py-3">
              <p className="text-teal-600">Ingresos</p><p className="text-lg font-bold text-teal-800">{fmtCOP(rep.ingresos)}</p>
            </div>
            <div className="rounded-xl bg-white border border-amber-100 px-4 py-3">
              <p className="text-amber-600">Costos (insumos)</p><p className="text-lg font-bold text-amber-800">{fmtCOP(rep.costos)}</p>
            </div>
            <div className="rounded-xl bg-white border border-emerald-100 px-4 py-3">
              <p className="text-emerald-600">Utilidad aproximada</p><p className="text-lg font-bold text-emerald-800">{fmtCOP(utilidad)} ({margen}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function Segmento({ nombre, valor, color }: { nombre: string; valor: number; color: string }) {
    const total = Math.max(1, rep.nuevos + rep.recurrentes + rep.inactivos);
    return (
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">{nombre}</span>
          <b className="text-slate-800">{valor}</b>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round((valor / total) * 100)}%` }} />
        </div>
      </div>
    );
  }
}
