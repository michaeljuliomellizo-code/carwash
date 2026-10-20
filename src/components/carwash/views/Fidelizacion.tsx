'use client';

// Fidelización — puntos ganados/canjeados y tarjeta digital de lavados.

import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Encabezado, TarjetaKPI, TablaSimple, CampoLabel, DialogoFormulario } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFechaHora, uid } from '@/lib/format';
import { Gift, Star, Award } from 'lucide-react';

export default function Fidelizacion() {
  const app = useApp();
  const { datos } = app;
  const [dialogo, setDialogo] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [puntos, setPuntos] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cfg = datos.configuraciones[0];
  const factor = cfg?.puntos_por_monto ?? 10000;

  const topClientes = useMemo(() =>
    [...datos.clientes].filter(c => c.puntos > 0).sort((a, b) => b.puntos - a.puntos).slice(0, 10),
    [datos.clientes]);

  const movimientos = useMemo(() =>
    [...datos.fidelidad_movimientos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 40),
    [datos.fidelidad_movimientos]);

  const totalPuntos = datos.clientes.reduce((a, c) => a + c.puntos, 0);

  const canjear = async () => {
    if (!clienteId || !puntos) return;
    const cliente = datos.clientes.find(c => c.id === clienteId);
    const n = Number(puntos);
    if (!cliente || cliente.puntos < n) { alert('El cliente no tiene suficientes puntos'); return; }
    await app.guardar('fidelidad_movimientos', { id: uid(), cliente_id: clienteId, tipo: 'canjeado', puntos: -n, descripcion: descripcion || 'Canje de recompensa', fecha: new Date().toISOString() });
    await app.guardar('clientes', { id: clienteId, puntos: cliente.puntos - n });
    setDialogo(false); setPuntos(''); setDescripcion('');
  };

  return (
    <div>
      <Encabezado titulo="Programa de fidelización" subtitulo={`Cada ${fmtCOP(factor)} en consumos = 1 punto · 100 puntos = lavado gratis`}
        accion={<Button onClick={() => setDialogo(true)} className="bg-teal-600 hover:bg-teal-700 text-white min-h-11"><Gift className="h-4 w-4 mr-1" /> Canjear puntos</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <TarjetaKPI titulo="Puntos activos" valor={String(totalPuntos)} icono={<Star className="h-5 w-5" />} tono="amber" />
        <TarjetaKPI titulo="Clientes con puntos" valor={String(datos.clientes.filter(c => c.puntos > 0).length)} icono={<Award className="h-5 w-5" />} tono="teal" />
        <TarjetaKPI titulo="Valor equivalente" valor={fmtCOP(totalPuntos * factor)} icono={<Gift className="h-5 w-5" />} tono="emerald" detalle="Si todos canjearan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ranking */}
        <Card className="border-slate-200/80">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">🏆 Top clientes por puntos</p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {topClientes.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                  <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">{c.nombre}</p>
                    <p className="text-xs text-slate-500">Total gastado: {fmtCOP(c.total_gastado)}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200">{c.puntos} pts</Badge>
                </div>
              ))}
              {topClientes.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sin puntos acumulados aún</p>}
            </div>
          </CardContent>
        </Card>

        {/* movimientos */}
        <Card className="border-slate-200/80">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Movimientos recientes</p>
            <TablaSimple encabezados={['Fecha', 'Cliente', 'Tipo', 'Puntos']}>
              {movimientos.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">Sin movimientos</td></tr>
              ) : movimientos.map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{fmtFechaHora(m.fecha)}</td>
                  <td className="px-4 py-2.5 font-medium">{datos.clientes.find(c => c.id === m.cliente_id)?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={m.tipo === 'ganado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                      {m.tipo}
                    </Badge>
                  </td>
                  <td className={`px-4 py-2.5 font-bold tabular-nums ${m.puntos >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {m.puntos >= 0 ? '+' : ''}{m.puntos}
                  </td>
                </tr>
              ))}
            </TablaSimple>
          </CardContent>
        </Card>
      </div>

      {/* tarjeta digital */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white mt-6">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-teal-900 mb-1">🎫 Tarjeta digital de lavados</p>
          <p className="text-xs text-teal-600 mb-4">Ejemplo de la tarjeta que ve el cliente — cada 5 lavados, el siguiente es gratis.</p>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 w-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">✓</div>
            ))}
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-teal-400 text-teal-600 flex items-center justify-center text-xl">🎁</div>
          </div>
        </CardContent>
      </Card>

      <DialogoFormulario abierto={dialogo} onCerrar={() => setDialogo(false)} titulo="Canjear puntos"
        descripcion="Descuenta puntos al cliente a cambio de una recompensa." onGuardar={canjear}>
        <div>
          <CampoLabel requerido>Cliente</CampoLabel>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {datos.clientes.filter(c => c.puntos > 0).map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} — {c.puntos} pts</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><CampoLabel requerido>Puntos a canjear</CampoLabel><Input type="number" value={puntos} onChange={e => setPuntos(e.target.value)} className="min-h-11" placeholder="100" /></div>
        <div><CampoLabel>Recompensa</CampoLabel><Input value={descripcion} onChange={e => setDescripcion(e.target.value)} className="min-h-11" placeholder="Lavado gratis" /></div>
      </DialogoFormulario>
    </div>
  );
}
