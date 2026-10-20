'use client';

// Métodos de pago — reporte de cobros por canal y listado de pagos.

import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Encabezado, TablaSimple, TarjetaKPI } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFechaHora } from '@/lib/format';
import { CreditCard, DollarSign, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ICONO_TIPO: Record<string, string> = {
  efectivo: '💵', tarjeta: '💳', transferencia: '🏦', nequi: '📱', daviplata: '📱', otros: '🔖',
};

export default function Pagos() {
  const { datos } = useApp();
  const [periodo, setPeriodo] = useState('hoy');

  const rangoISO = useMemo(() => {
    const dias = periodo === 'hoy' ? 1 : periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 365;
    return new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
  }, [periodo]);

  const pagosFiltrados = useMemo(() => datos.pagos.filter(p => p.fecha.slice(0, 10) >= rangoISO), [datos.pagos, rangoISO]);

  const porMetodo = useMemo(() => datos.metodos_pago.map(m => {
    const total = pagosFiltrados.filter(p => p.metodo_id === m.id).reduce((a, p) => a + p.monto, 0);
    return { ...m, total, cantidad: pagosFiltrados.filter(p => p.metodo_id === m.id).length };
  }).filter(m => m.total > 0 || m.activo).sort((a, b) => b.total - a.total), [datos.metodos_pago, pagosFiltrados]);

  const total = porMetodo.reduce((a, m) => a + m.total, 0);

  return (
    <div>
      <Encabezado titulo="Métodos de pago" subtitulo="Distribución de cobros por canal"
        accion={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40 min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="anio">Este año</SelectItem>
            </SelectContent>
          </Select>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <TarjetaKPI titulo="Total cobrado" valor={fmtCOP(total)} icono={<DollarSign className="h-5 w-5" />} tono="emerald" />
        <TarjetaKPI titulo="Pagos registrados" valor={String(pagosFiltrados.length)} icono={<Receipt className="h-5 w-5" />} tono="teal" />
        <TarjetaKPI titulo="Canales con ventas" valor={String(porMetodo.filter(m => m.total > 0).length)} icono={<CreditCard className="h-5 w-5" />} tono="sky" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base">Reporte por método</CardTitle></CardHeader>
          <CardContent>
            <TablaSimple encabezados={['Método', 'Pagos', 'Total', '%']}>
              {porMetodo.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">Sin pagos en el periodo</td></tr>
              ) : porMetodo.map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{ICONO_TIPO[m.tipo] ?? '🔖'} {m.nombre}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-500">{m.cantidad}</td>
                  <td className="px-4 py-2.5 font-bold tabular-nums text-teal-700">{fmtCOP(m.total)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                      {total > 0 ? Math.round((m.total / total) * 100) : 0}%
                    </Badge>
                  </td>
                </tr>
              ))}
              {porMetodo.length > 0 && (
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 font-bold">Total</td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5 font-bold tabular-nums text-slate-900">{fmtCOP(total)}</td>
                  <td className="px-4 py-2.5"></td>
                </tr>
              )}
            </TablaSimple>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base">Gráfico por canal</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMetodo.map(m => ({ nombre: m.nombre, total: m.total }))} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={90} tickLine={false} axisLine={false} />
                  <Tooltip formatter={v => [fmtCOP(Number(v)), 'Total']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="total" fill="#0d9488" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm font-semibold text-slate-700 mb-2">Últimos pagos</p>
      <TablaSimple encabezados={['Fecha', 'Orden', 'Cliente', 'Método', 'Monto']}>
        {pagosFiltrados.length === 0 ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Sin pagos registrados en el periodo</td></tr>
        ) : [...pagosFiltrados].reverse().slice(0, 40).map(p => {
          const o = datos.ordenes.find(x => x.id === p.orden_id);
          const m = datos.metodos_pago.find(x => x.id === p.metodo_id);
          const c = o ? datos.clientes.find(x => x.id === o.cliente_id) : null;
          return (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 text-xs text-slate-500">{fmtFechaHora(p.fecha)}</td>
              <td className="px-4 py-2.5 font-semibold text-teal-700">#{String(o?.numero ?? '—').padStart(4, '0')}</td>
              <td className="px-4 py-2.5">{c?.nombre ?? '—'}</td>
              <td className="px-4 py-2.5">{ICONO_TIPO[m?.tipo ?? 'otros'] ?? '🔖'} {m?.nombre ?? '—'}</td>
              <td className="px-4 py-2.5 font-bold tabular-nums text-slate-900">{fmtCOP(p.monto)}</td>
            </tr>
          );
        })}
      </TablaSimple>
      <p className="text-xs text-slate-400 mt-3">
        Para gestionar el catálogo de métodos usa el módulo “Métodos de pago” de la sección Finanzas.
        <Button variant="link" size="sm" className="p-0 h-auto text-teal-700" onClick={() => { window.location.hash = '/configuracion'; }}>Configuración</Button>
      </p>
    </div>
  );
}
