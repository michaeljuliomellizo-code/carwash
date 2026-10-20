'use client';

// Dashboard principal — KPIs del día, comparación con ayer, metodos de pago,
// pendientes, alertas de inventario y gráfico semanal.

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Car, Bike, Sparkles, DollarSign, Banknote, CreditCard, Landmark, Smartphone,
  Hourglass, CheckCircle2, Package, TrendingUp, TrendingDown, Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApp } from '@/lib/store';
import { TarjetaKPI, EtiquetaEstado } from '@/components/carwash/ui-bits';
import { fmtCOP, fmtNum, hoyISO, diasAtras } from '@/lib/format';

export default function Dashboard() {
  const { datos, organizacion } = useApp();
  const cfg = datos.configuraciones[0];
  const meta = cfg?.meta_diaria ?? 1000000;

  const resumen = useMemo(() => {
    const hoy = hoyISO();
    const esHoy = (f: string) => f.slice(0, 10) === hoy;
    const ordenesHoy = datos.ordenes.filter(o => esHoy(o.fecha_entrada));
    const ordenesAyer = datos.ordenes.filter(o => o.fecha_entrada.slice(0, 10) === new Date(Date.now() - 86400000).toISOString().slice(0, 10));
    const pagosHoy = datos.pagos.filter(p => esHoy(p.fecha));
    const pagosAyer = datos.pagos.filter(p => p.fecha.slice(0, 10) === new Date(Date.now() - 86400000).toISOString().slice(0, 10));

    const porMetodo = (pagos: typeof pagosHoy) => {
      const r: Record<string, number> = { efectivo: 0, tarjeta: 0, transferencia: 0, nequi: 0, daviplata: 0, otros: 0 };
      for (const p of pagos) {
        const m = datos.metodos_pago.find(x => x.id === p.metodo_id);
        r[m?.tipo ?? 'otros'] += p.monto;
      }
      return r;
    };

    const total = (ps: typeof pagosHoy) => ps.reduce((a, p) => a + p.monto, 0);
    const tiposVeh = (ords: typeof ordenesHoy) => {
      let carros = 0, motos = 0;
      for (const o of ords) {
        const v = datos.vehiculos.find(x => x.id === o.vehiculo_id);
        if (v?.tipo === 'carro') carros++; else if (v?.tipo === 'moto') motos++;
      }
      return { carros, motos };
    };

    return {
      hoy: { ordenes: ordenesHoy, pagos: pagosHoy, metodos: porMetodo(pagosHoy), ventas: total(pagosHoy), ...tiposVeh(ordenesHoy) },
      ayer: { ventas: total(pagosAyer), servicios: ordenesAyer.length, ...tiposVeh(ordenesAyer) },
      pendientes: datos.ordenes.filter(o => ['recibido', 'en_proceso'].includes(o.estado)),
      empleadosActivos: datos.empleados.filter(e => e.activo && e.rol === 'lavador'),
      ordenesPorEmpleado: datos.ordenes.filter(o => esHoy(o.fecha_entrada) && o.empleado_id),
      alertasInventario: datos.inventario_productos.filter(p => p.activo && p.stock < p.stock_minimo),
      semana: Array.from({ length: 7 }, (_, i) => {
        const f = new Date(Date.now() - (6 - i) * 86400000);
        const iso = f.toISOString().slice(0, 10);
        const ords = datos.ordenes.filter(o => o.fecha_entrada.slice(0, 10) === iso);
        const pgs = datos.pagos.filter(p => p.fecha.slice(0, 10) === iso);
        return {
          dia: f.toLocaleDateString('es-CO', { weekday: 'short' }),
          ventas: pgs.reduce((a, p) => a + p.monto, 0),
          servicios: ords.length,
        };
      }),
    };
  }, [datos]);

  const variacion = resumen.ayer.ventas > 0
    ? Math.round(((resumen.hoy.ventas - resumen.ayer.ventas) / resumen.ayer.ventas) * 100)
    : resumen.hoy.ventas > 0 ? 100 : 0;

  const metodos = [
    { k: 'efectivo', nombre: 'Efectivo', icono: <Banknote className="h-4 w-4" /> },
    { k: 'tarjeta', nombre: 'Tarjeta', icono: <CreditCard className="h-4 w-4" /> },
    { k: 'transferencia', nombre: 'Transferencia', icono: <Landmark className="h-4 w-4" /> },
    { k: 'nequi', nombre: 'Nequi', icono: <Smartphone className="h-4 w-4" /> },
    { k: 'daviplata', nombre: 'Daviplata', icono: <Smartphone className="h-4 w-4" /> },
    { k: 'otros', nombre: 'Otros', icono: <DollarSign className="h-4 w-4" /> },
  ];

  const avanceMeta = Math.min(100, Math.round((resumen.hoy.ventas / meta) * 100));

  return (
    <div className="space-y-5">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <TarjetaKPI titulo="Ventas del día" valor={fmtCOP(resumen.hoy.ventas)} icono={<DollarSign className="h-5 w-5" />} tono="emerald"
          detalle={variacion >= 0 ? `▲ ${variacion}% vs ayer` : `▼ ${Math.abs(variacion)}% vs ayer`} />
        <TarjetaKPI titulo="Vehículos atendidos" valor={fmtNum(resumen.hoy.carros)} icono={<Car className="h-5 w-5" />} tono="teal"
          detalle={`Ayer: ${resumen.ayer.carros}`} />
        <TarjetaKPI titulo="Motos atendidas" valor={fmtNum(resumen.hoy.motos)} icono={<Bike className="h-5 w-5" />} tono="sky"
          detalle={`Ayer: ${resumen.ayer.motos}`} />
        <TarjetaKPI titulo="Servicios realizados" valor={fmtNum(resumen.hoy.ordenes.length)} icono={<Sparkles className="h-5 w-5" />} tono="amber"
          detalle={`Ayer: ${resumen.ayer.servicios}`} />
      </div>

      {/* Meta del día */}
      <Card className="border-slate-200/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Meta diaria: {fmtCOP(meta)}</p>
            <span className={`text-sm font-bold ${avanceMeta >= 100 ? 'text-emerald-600' : 'text-slate-600'}`}>{avanceMeta}%</span>
          </div>
          <Progress value={avanceMeta} className="h-3" />
          <p className="text-xs text-slate-400 mt-1.5">
            {resumen.hoy.ventas >= meta ? '🎉 ¡Meta cumplida! Excelente día.' : `Faltan ${fmtCOP(Math.max(0, meta - resumen.hoy.ventas))} para cumplir la meta`}
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Métodos de pago */}
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base">💵 Ingresos por método (hoy)</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {metodos.map(m => (
              <div key={m.k} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">{m.icono}</span>
                  {m.nombre}
                </span>
                <span className="text-sm font-semibold tabular-nums text-slate-800">{fmtCOP(resumen.hoy.metodos[m.k] ?? 0)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
              <span className="text-sm font-bold text-slate-700">Total</span>
              <span className="text-sm font-bold tabular-nums text-teal-700">{fmtCOP(resumen.hoy.ventas)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pendientes + equipo */}
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-amber-500" /> Vehículos pendientes ({resumen.pendientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumen.pendientes.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Todo al día, sin pendientes
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {resumen.pendientes.map(o => {
                  const v = datos.vehiculos.find(x => x.id === o.vehiculo_id);
                  const s = datos.servicios.find(x => x.id === o.servicio_id);
                  return (
                    <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          #{String(o.numero).padStart(4, '0')} · {v?.placa} {v?.tipo === 'moto' ? '🏍️' : '🚗'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{s?.nombre} · {fmtCOP(o.total)}</p>
                      </div>
                      <EtiquetaEstado estado={o.estado} />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
              <Users className="h-4 w-4 text-teal-600" />
              Lavadores activos: <b className="text-slate-700">{resumen.empleadosActivos.length}</b>
              · Atendiendo hoy: <b className="text-slate-700">{new Set(resumen.ordenesPorEmpleado.map(o => o.empleado_id)).size}</b>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Gráfico semanal */}
        <Card className="border-slate-200/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {variacion >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />}
              Ventas últimos 7 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumen.semana} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                  <Tooltip formatter={(v) => [fmtCOP(Number(v)), 'Ventas']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="ventas" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas inventario */}
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-rose-500" /> Alertas de compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumen.alertasInventario.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Inventario saludable ✅</p>
            ) : (
              <div className="space-y-2">
                {resumen.alertasInventario.map(p => (
                  <div key={p.id} className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
                    <p className="text-sm font-medium text-rose-800">🔴 {p.nombre}</p>
                    <p className="text-xs text-rose-600">
                      Stock: {fmtNum(p.stock)} {p.unidad} · Mínimo: {fmtNum(p.stock_minimo)} {p.unidad}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
