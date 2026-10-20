'use client';

// Reservas — citas online (también accesible sin sesión desde el menú público).

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Encabezado, BotonNuevo, Vacio, DialogoFormulario, CampoLabel, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, uid } from '@/lib/format';
import type { Reserva } from '@/lib/types';
import { Pencil, Trash2, CalendarClock } from 'lucide-react';

export default function Reservas() {
  const app = useApp();
  const { datos } = app;
  const [dialogo, setDialogo] = useState<Reserva | 'nuevo' | null>(null);
  const [form, setForm] = useState({ nombre: '', telefono: '', servicio_id: '', fecha: '', hora: '', notas: '' });

  const reservas = useMemo(() => [...datos.reservas].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)), [datos.reservas]);

  const abrirNuevo = () => {
    setForm({ nombre: '', telefono: '', servicio_id: '', fecha: new Date().toISOString().slice(0, 10), hora: '10:00', notas: '' });
    setDialogo('nuevo');
  };

  const abrirEditar = (r: Reserva) => {
    setForm({
      nombre: r.nombre_visitante ?? datos.clientes.find(c => c.id === r.cliente_id)?.nombre ?? '',
      telefono: r.telefono_visitante ?? '', servicio_id: r.servicio_id, fecha: r.fecha, hora: r.hora, notas: r.notas ?? '',
    });
    setDialogo(r);
  };

  const guardar = async () => {
    if (!form.servicio_id || !form.fecha || !form.hora) return;
    const base = dialogo === 'nuevo' ? {} : { id: (dialogo as Reserva).id };
    await app.guardar('reservas', {
      ...base, id: dialogo === 'nuevo' ? uid() : (dialogo as Reserva).id,
      nombre_visitante: form.nombre || null, telefono_visitante: form.telefono || null,
      servicio_id: form.servicio_id, fecha: form.fecha, hora: form.hora, notas: form.notas,
      estado: dialogo === 'nuevo' ? 'pendiente' : (dialogo as Reserva).estado,
    });
    setDialogo(null);
  };

  const cambiarEstado = async (r: Reserva, estado: Reserva['estado']) => {
    await app.guardar('reservas', { id: r.id, estado });
  };

  return (
    <div>
      <Encabezado titulo="Reservas" subtitulo="Citas agendadas desde la web — confirma y gestiona"
        accion={<BotonNuevo texto="Nueva reserva" onClick={abrirNuevo} />} />

      {reservas.length === 0 ? (
        <Vacio mensaje="Sin reservas aún. Los clientes pueden reservar desde la opción “Reservar cita” del menú." icono={<CalendarClock className="h-7 w-7" />} />
      ) : (
        <TablaSimple encabezados={['Código', 'Cliente', 'Servicio', 'Fecha y hora', 'Teléfono', 'Estado', '']}>
          {reservas.map(r => {
            const s = datos.servicios.find(x => x.id === r.servicio_id);
            return (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-bold text-teal-700">{r.codigo}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{r.nombre_visitante || datos.clientes.find(c => c.id === r.cliente_id)?.nombre || '—'}</td>
                <td className="px-4 py-3">{s?.nombre} <span className="text-xs text-slate-400">({fmtCOP(s?.precio ?? 0)})</span></td>
                <td className="px-4 py-3 whitespace-nowrap">{r.fecha} · {r.hora}</td>
                <td className="px-4 py-3 text-slate-600">{r.telefono_visitante || '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={
                    r.estado === 'pendiente' ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : r.estado === 'confirmada' ? 'bg-sky-100 text-sky-800 border-sky-200'
                    : r.estado === 'completada' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-100 text-rose-700 border-rose-200'
                  }>{r.estado}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {r.estado === 'pendiente' && <Button size="sm" variant="outline" className="min-h-8 h-8 text-xs" onClick={() => cambiarEstado(r, 'confirmada')}>Confirmar</Button>}
                    {r.estado === 'confirmada' && <Button size="sm" variant="outline" className="min-h-8 h-8 text-xs" onClick={() => cambiarEstado(r, 'completada')}>Completar</Button>}
                    <Button size="sm" variant="ghost" onClick={() => abrirEditar(r)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                    <Button size="sm" variant="ghost" onClick={async () => { if (confirm('¿Eliminar reserva?')) await app.eliminar('reservas', r.id); }}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </TablaSimple>
      )}

      <DialogoFormulario abierto={!!dialogo} onCerrar={() => setDialogo(null)}
        titulo={dialogo === 'nuevo' ? 'Nueva reserva' : 'Editar reserva'} onGuardar={guardar}>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel>Nombre</CampoLabel><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="min-h-11" placeholder="Cliente visitante" /></div>
          <div><CampoLabel>Teléfono</CampoLabel><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="min-h-11" placeholder="3001234567" /></div>
        </div>
        <div>
          <CampoLabel requerido>Servicio</CampoLabel>
          <Select value={form.servicio_id} onValueChange={v => setForm({ ...form, servicio_id: v })}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {datos.servicios.filter(s => s.activo).map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} ({s.tipo_vehiculo}) — {fmtCOP(s.precio)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel requerido>Fecha</CampoLabel><Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="min-h-11" /></div>
          <div><CampoLabel requerido>Hora</CampoLabel><Input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className="min-h-11" /></div>
        </div>
        <div><CampoLabel>Notas</CampoLabel><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="min-h-11" /></div>
      </DialogoFormulario>
    </div>
  );
}
