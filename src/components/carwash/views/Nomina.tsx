'use client';

// Nómina — periodos de trabajo según frecuencia de pago, cierre y pagos del equipo.

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Encabezado, BotonNuevo, Vacio, DialogoFormulario, CampoLabel, TarjetaKPI, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFecha, uid } from '@/lib/format';
import type { PeriodoNomina } from '@/lib/types';
import { Banknote, Lock, LockOpen, Pencil } from 'lucide-react';

export default function Nomina() {
  const app = useApp();
  const { datos } = app;
  const [dialogo, setDialogo] = useState<PeriodoNomina | 'nuevo' | null>(null);
  const [nombre, setNombre] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [frecuencia, setFrecuencia] = useState('quincenal');
  const [detalle, setDetalle] = useState<PeriodoNomina | null>(null);

  const periodos = useMemo(() => [...datos.periodos_nomina].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)), [datos.periodos_nomina]);
  const abierto = periodos.find(p => p.estado === 'abierto') ?? null;

  const comisionesPeriodo = (p: PeriodoNomina) => datos.comisiones.filter(c =>
    c.periodo_id === p.id ||
    (!c.periodo_id && new Date(c.fecha).toISOString().slice(0, 10) >= p.fecha_inicio && new Date(c.fecha).toISOString().slice(0, 10) <= p.fecha_fin)
  );

  const abrirNuevo = () => {
    setNombre(''); setInicio(new Date().toISOString().slice(0, 10));
    setFin(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)); setFrecuencia('quincenal');
    setDialogo('nuevo');
  };

  const abrirEditar = (p: PeriodoNomina) => {
    setNombre(p.nombre); setInicio(p.fecha_inicio); setFin(p.fecha_fin); setFrecuencia(p.tipo_frecuencia);
    setDialogo(p);
  };

  const guardar = async () => {
    if (!nombre.trim() || !inicio || !fin) return;
    const base = dialogo === 'nuevo' ? {} : { id: (dialogo as PeriodoNomina).id };
    await app.guardar('periodos_nomina', {
      ...base, nombre, fecha_inicio: inicio, fecha_fin: fin, tipo_frecuencia: frecuencia,
      estado: dialogo === 'nuevo' ? 'abierto' : (dialogo as PeriodoNomina).estado,
    });
    setDialogo(null);
  };

  const cerrarPeriodo = async (p: PeriodoNomina) => {
    const comps = comisionesPeriodo(p);
    const total = comps.reduce((a, c) => a + c.monto, 0);
    for (const c of comps) if (c.periodo_id !== p.id) await app.guardar('comisiones', { id: c.id, periodo_id: p.id });
    await app.guardar('periodos_nomina', { id: p.id, estado: 'cerrado', total_comisiones: total });
  };

  return (
    <div>
      <Encabezado titulo="Nómina / Periodos de pago" subtitulo="Ciclos según la frecuencia de pago del equipo"
        accion={<BotonNuevo texto="Nuevo periodo" onClick={abrirNuevo} />} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <TarjetaKPI titulo="Periodo abierto" valor={abierto ? abierto.nombre : 'Ninguno'} icono={<LockOpen className="h-5 w-5" />} tono={abierto ? 'emerald' : 'slate'} />
        <TarjetaKPI titulo="Comisiones del periodo" valor={abierto ? fmtCOP(comisionesPeriodo(abierto).reduce((a, c) => a + c.monto, 0)) : fmtCOP(0)} icono={<Banknote className="h-5 w-5" />} tono="teal" />
        <TarjetaKPI titulo="Periodos cerrados" valor={String(periodos.filter(p => p.estado === 'cerrado').length)} icono={<Lock className="h-5 w-5" />} tono="slate" />
      </div>

      {periodos.length === 0 ? (
        <Vacio mensaje="Crea tu primer periodo de nómina (semanal, quincenal o mensual) para liquidar al equipo." />
      ) : (
        <div className="space-y-3">
          {periodos.map(p => {
            const comps = comisionesPeriodo(p);
            const total = comps.reduce((a, c) => a + c.monto, 0);
            return (
              <Card key={p.id} className="border-slate-200/80">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{p.nombre}</p>
                        <Badge variant="outline" className={p.estado === 'abierto' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>{p.estado}</Badge>
                        <Badge variant="outline" className="capitalize">{p.tipo_frecuencia}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{fmtFecha(p.fecha_inicio)} → {fmtFecha(p.fecha_fin)} · {comps.length} comisiones</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-teal-700 tabular-nums">{fmtCOP(total)}</span>
                      <Button size="sm" variant="ghost" onClick={() => abrirEditar(p)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                      {p.estado === 'abierto' && (
                        <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white" onClick={() => { if (confirm('¿Cerrar el periodo? Las comisiones quedarán liquidadas.')) cerrarPeriodo(p); }}>
                          <Lock className="h-3.5 w-3.5 mr-1" /> Cerrar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setDetalle(p)}>Ver liquidación</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* liquidación por empleado */}
      {detalle && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{detalle.nombre}</h3>
                <p className="text-sm text-slate-500">Liquidación del equipo</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDetalle(null)}>✕</Button>
            </div>
            <TablaSimple encabezados={['Empleado', 'Servicios', 'Base', '%', 'Comisión', '']}>
              {datos.empleados.filter(e => e.activo).map(e => {
                const propias = comisionesPeriodo(detalle).filter(c => c.empleado_id === e.id);
                if (propias.length === 0) return null;
                const base = propias.reduce((a, c) => a + c.base, 0);
                const monto = propias.reduce((a, c) => a + c.monto, 0);
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{e.nombre}</td>
                    <td className="px-4 py-2.5">{propias.length}</td>
                    <td className="px-4 py-2.5 tabular-nums">{fmtCOP(base)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{e.porcentaje_comision}%</td>
                    <td className="px-4 py-2.5 font-bold tabular-nums text-teal-700">{fmtCOP(monto)}</td>
                    <td className="px-4 py-2.5">
                      <Button size="sm" variant="outline" disabled={detalle.estado === 'cerrado'}
                        onClick={async () => {
                          await app.guardar('pagos_nomina', { id: uid(), periodo_id: detalle.id, empleado_id: e.id, monto, metodo: 'transferencia', notas: 'Liquidación de comisiones', fecha: new Date().toISOString() });
                          for (const c of propias) await app.guardar('comisiones', { id: c.id, estado: 'pagada' });
                        }}>Marcar pagado</Button>
                    </td>
                  </tr>
                );
              })}
            </TablaSimple>
            <div className="mt-3 flex justify-between text-sm font-bold">
              <span>Total del periodo</span>
              <span className="text-teal-700 tabular-nums">{fmtCOP(comisionesPeriodo(detalle).reduce((a, c) => a + c.monto, 0))}</span>
            </div>
          </div>
        </div>
      )}

      <DialogoFormulario abierto={!!dialogo} onCerrar={() => setDialogo(null)}
        titulo={dialogo === 'nuevo' ? 'Nuevo periodo de nómina' : 'Editar periodo'} onGuardar={guardar}>
        <div><CampoLabel requerido>Nombre</CampoLabel><Input value={nombre} onChange={e => setNombre(e.target.value)} className="min-h-11" placeholder="Quincena 1 — octubre" /></div>
        <div>
          <CampoLabel requerido>Frecuencia de pago</CampoLabel>
          <Select value={frecuencia} onValueChange={setFrecuencia}>
            <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="quincenal">Quincenal</SelectItem>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel requerido>Desde</CampoLabel><Input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="min-h-11" /></div>
          <div><CampoLabel requerido>Hasta</CampoLabel><Input type="date" value={fin} onChange={e => setFin(e.target.value)} className="min-h-11" /></div>
        </div>
      </DialogoFormulario>
    </div>
  );
}
