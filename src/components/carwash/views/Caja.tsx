'use client';

// Caja — apertura, movimientos (entradas/salidas), cierre y arqueo con diferencia.

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Encabezado, DialogoFormulario, CampoLabel, TablaSimple, TarjetaKPI, Vacio } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFechaHora, hoyISO } from '@/lib/format';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Lock, Unlock, Plus } from 'lucide-react';

const CATEGORIAS_ENTRADA = ['servicios', 'productos', 'otros_ingresos'];
const CATEGORIAS_SALIDA = ['compras', 'gastos', 'devoluciones', 'otros'];

export default function Caja() {
  const app = useApp();
  const { datos } = app;
  const [dialogoMov, setDialogoMov] = useState<null | 'entrada' | 'salida'>(null);
  const [dialogoApertura, setDialogoApertura] = useState(false);
  const [dialogoCierre, setDialogoCierre] = useState(false);

  const sesionAbierta = useMemo(() => datos.caja_sesiones.find(c => c.estado === 'abierta') ?? null, [datos.caja_sesiones]);
  const historial = useMemo(() => [...datos.caja_sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha)), [datos.caja_sesiones]);

  const movsSesion = useMemo(() =>
    sesionAbierta ? datos.caja_movimientos.filter(m => m.sesion_id === sesionAbierta.id) : [],
    [datos.caja_movimientos, sesionAbierta]);

  const entradas = movsSesion.filter(m => m.tipo === 'entrada').reduce((a, m) => a + m.monto, 0);
  const salidas = movsSesion.filter(m => m.tipo === 'salida').reduce((a, m) => a + m.monto, 0);
  const esperado = sesionAbierta ? sesionAbierta.monto_apertura + entradas - salidas : 0;

  return (
    <div>
      <Encabezado titulo="Caja" subtitulo="Apertura, movimientos y arqueo diario"
        accion={
          sesionAbierta ? (
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => setDialogoMov('entrada')}><ArrowDownCircle className="h-4 w-4 text-emerald-600 mr-1" /> Entrada</Button>
              <Button variant="outline" className="min-h-11" onClick={() => setDialogoMov('salida')}><ArrowUpCircle className="h-4 w-4 text-rose-600 mr-1" /> Salida</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white min-h-11" onClick={() => setDialogoCierre(true)}><Lock className="h-4 w-4 mr-1" /> Cerrar caja</Button>
            </div>
          ) : (
            <Button className="bg-teal-600 hover:bg-teal-700 text-white min-h-11" onClick={() => setDialogoApertura(true)}>
              <Unlock className="h-4 w-4 mr-1" /> Abrir caja
            </Button>
          )
        } />

      {!sesionAbierta ? (
        <Card className="border-slate-200/80">
          <CardContent className="p-6">
            <Vacio mensaje="No hay caja abierta. Realiza la apertura para registrar movimientos del día."
              icono={<Wallet className="h-7 w-7" />} />
            <div className="max-w-2xl mx-auto mt-2">
              <p className="text-xs font-semibold text-slate-500 mb-2">HISTORIAL DE CAJAS</p>
              <TablaSimple encabezados={['Fecha', 'Apertura', 'Esperado', 'Cierre real', 'Diferencia', 'Estado']}>
                {historial.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5">{c.fecha}</td>
                    <td className="px-4 py-2.5 tabular-nums">{fmtCOP(c.monto_apertura)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{c.monto_esperado ? fmtCOP(c.monto_esperado) : '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{c.monto_cierre ? fmtCOP(c.monto_cierre) : '—'}</td>
                    <td className={`px-4 py-2.5 tabular-nums font-medium ${(c.diferencia ?? 0) < 0 ? 'text-rose-600' : (c.diferencia ?? 0) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {c.diferencia !== null && c.diferencia !== undefined ? fmtCOP(c.diferencia) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={c.estado === 'abierta' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                        {c.estado}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </TablaSimple>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <TarjetaKPI titulo="Apertura" valor={fmtCOP(sesionAbierta.monto_apertura)} icono={<Unlock className="h-5 w-5" />} tono="slate" detalle={`Fecha: ${sesionAbierta.fecha}`} />
            <TarjetaKPI titulo="Entradas" valor={fmtCOP(entradas)} icono={<ArrowDownCircle className="h-5 w-5" />} tono="emerald" detalle={`${movsSesion.filter(m => m.tipo === 'entrada').length} movimientos`} />
            <TarjetaKPI titulo="Salidas" valor={fmtCOP(salidas)} icono={<ArrowUpCircle className="h-5 w-5" />} tono="rose" detalle={`${movsSesion.filter(m => m.tipo === 'salida').length} movimientos`} />
            <TarjetaKPI titulo="Caja esperada" valor={fmtCOP(esperado)} icono={<Wallet className="h-5 w-5" />} tono="teal" detalle="Apertura + entradas − salidas" />
          </div>

          <TablaSimple encabezados={['Hora', 'Tipo', 'Categoría', 'Concepto', 'Método', 'Monto']}>
            {movsSesion.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Sin movimientos aún en esta sesión</td></tr>
            ) : [...movsSesion].reverse().map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-xs text-slate-500">{fmtFechaHora(m.fecha).split(',')[1] ?? ''}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className={m.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}>
                    {m.tipo}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 capitalize text-slate-600">{m.categoria.replace('_', ' ')}</td>
                <td className="px-4 py-2.5 text-slate-800">{m.concepto}</td>
                <td className="px-4 py-2.5 capitalize text-slate-500">{m.metodo}</td>
                <td className={`px-4 py-2.5 font-semibold tabular-nums ${m.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {m.tipo === 'entrada' ? '+' : '−'}{fmtCOP(m.monto)}
                </td>
              </tr>
            ))}
          </TablaSimple>
        </div>
      )}

      {/* apertura */}
      <DialogoApertura abierto={dialogoApertura} onCerrar={() => setDialogoApertura(false)} />
      {/* cierre */}
      <DialogoCierre abierto={dialogoCierre} onCerrar={() => setDialogoCierre(false)} esperado={esperado} sesionId={sesionAbierta?.id ?? ''} />
      {/* movimiento */}
      <DialogoMovimiento tipo={dialogoMov} onCerrar={() => setDialogoMov(null)} sesionId={sesionAbierta?.id ?? ''} />
    </div>
  );

  function DialogoApertura({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
    const [monto, setMonto] = useState('200000');
    const [err, setErr] = useState<string | null>(null);
    return (
      <DialogoFormulario abierto={abierto} onCerrar={onCerrar} titulo="🔓 Apertura de caja"
        descripcion="Registra el efectivo inicial con el que inicia el día." onGuardar={async () => {
          const e = await app.abrirCaja(Number(monto || 0));
          setErr(e); if (!e) onCerrar();
        }}>
        <div><CampoLabel requerido>Monto de apertura (COP)</CampoLabel>
          <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="min-h-11" /></div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
      </DialogoFormulario>
    );
  }

  function DialogoCierre({ abierto, onCerrar, esperado, sesionId }: { abierto: boolean; onCerrar: () => void; esperado: number; sesionId: string }) {
    const [real, setReal] = useState('');
    const [obs, setObs] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const dif = (Number(real || 0)) - esperado;
    return (
      <DialogoFormulario abierto={abierto} onCerrar={onCerrar} titulo="🔒 Cierre de caja y arqueo"
        descripcion="Compara el efectivo contado con el esperado." onGuardar={async () => {
          const e = await app.cerrarCaja(Number(real || 0), obs);
          setErr(e); if (!e) { setReal(''); onCerrar(); }
        }}>
        <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Caja esperada</span><b className="tabular-nums">{fmtCOP(esperado)}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Fecha</span><b>{hoyISO()}</b></div>
        </div>
        <div><CampoLabel requerido>Efectivo real contado (COP)</CampoLabel>
          <Input type="number" value={real} onChange={e => setReal(e.target.value)} className="min-h-11" placeholder="0" /></div>
        {real !== '' && (
          <div className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${dif === 0 ? 'bg-emerald-50 text-emerald-700' : dif < 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
            Diferencia: {fmtCOP(dif)} {dif === 0 ? '✅ Caja cuadrada' : dif < 0 ? '⚠️ Faltante' : 'ℹ️ Sobrante'}
          </div>
        )}
        <div><CampoLabel>Observaciones</CampoLabel>
          <Input value={obs} onChange={e => setObs(e.target.value)} className="min-h-11" placeholder="Ej: diferencia en billetes pequeños" /></div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <input type="hidden" value={sesionId} />
      </DialogoFormulario>
    );
  }

  function DialogoMovimiento({ tipo, onCerrar, sesionId }: { tipo: null | 'entrada' | 'salida'; onCerrar: () => void; sesionId: string }) {
    const [categoria, setCategoria] = useState('');
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [err, setErr] = useState<string | null>(null);
    if (!tipo) return null;
    const cats = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SALIDA;
    return (
      <DialogoFormulario abierto onCerrar={onCerrar} titulo={tipo === 'entrada' ? '➕ Entrada de caja' : '➖ Salida de caja'}
        onGuardar={async () => {
          if (!concepto || !monto) { setErr('Completa concepto y monto'); return; }
          const e = await app.guardar('caja_movimientos', {
            sesion_id: sesionId || null, tipo, categoria: categoria || cats[0], concepto,
            monto: Number(monto), metodo: 'efectivo', fecha: new Date().toISOString(),
          });
          setErr(e); if (!e) { setConcepto(''); setMonto(''); setCategoria(''); onCerrar(); }
        }}>
        <div>
          <CampoLabel>Categoría</CampoLabel>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {cats.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><CampoLabel requerido>Concepto</CampoLabel>
          <Input value={concepto} onChange={e => setConcepto(e.target.value)} className="min-h-11" placeholder="Compra de shampoo…" /></div>
        <div><CampoLabel requerido>Monto (COP)</CampoLabel>
          <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="min-h-11" /></div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <Plus className="hidden" />
      </DialogoFormulario>
    );
  }
}
