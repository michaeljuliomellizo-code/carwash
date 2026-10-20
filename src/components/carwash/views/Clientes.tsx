'use client';

// Clientes — CRUD con ficha completa, historial de vehículos y gasto acumulado.

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Encabezado, BotonNuevo, Vacio, DialogoFormulario, CampoLabel, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFecha } from '@/lib/format';
import type { Cliente } from '@/lib/types';
import { Search, Eye, Pencil, Trash2, Gift } from 'lucide-react';

const VACIO = { nombre: '', documento: '', telefono: '', whatsapp: '', email: '', direccion: '', observaciones: '' };

export default function Clientes() {
  const app = useApp();
  const { datos } = app;
  const [busqueda, setBusqueda] = useState('');
  const [ficha, setFicha] = useState<Cliente | null>(null);
  const [dialogo, setDialogo] = useState<Cliente | 'nuevo' | null>(null);
  const [form, setForm] = useState<typeof VACIO>(VACIO);

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return datos.clientes
      .filter(c => !q || c.nombre.toLowerCase().includes(q) || (c.documento ?? '').includes(q) || (c.telefono ?? '').includes(q))
      .sort((a, b) => b.total_gastado - a.total_gastado);
  }, [datos.clientes, busqueda]);

  const abrirNuevo = () => { setForm(VACIO); setDialogo('nuevo'); };
  const abrirEditar = (c: Cliente) => {
    setForm({ nombre: c.nombre, documento: c.documento ?? '', telefono: c.telefono ?? '', whatsapp: c.whatsapp ?? '', email: c.email ?? '', direccion: c.direccion ?? '', observaciones: c.observaciones ?? '' });
    setDialogo(c);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    const base = dialogo === 'nuevo' ? {} : { id: (dialogo as Cliente).id };
    await app.guardar('clientes', {
      ...base, nombre: form.nombre, documento: form.documento, telefono: form.telefono,
      whatsapp: form.whatsapp || form.telefono, email: form.email, direccion: form.direccion,
      observaciones: form.observaciones, activo: true,
    });
    setDialogo(null);
  };

  return (
    <div>
      <Encabezado titulo="Clientes" subtitulo="Fichas, historial y fidelización"
        accion={<BotonNuevo texto="Nuevo cliente" onClick={abrirNuevo} />} />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Buscar por nombre, documento o teléfono…" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9 min-h-11" />
      </div>

      {lista.length === 0 ? (
        <Vacio mensaje="Aún no hay clientes. Registra el primero para comenzar." />
      ) : (
        <TablaSimple encabezados={['Cliente', 'Documento', 'Teléfono', 'Puntos', 'Total gastado', 'Última visita', '']}>
          {lista.map(c => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{c.nombre}</td>
              <td className="px-4 py-3 text-slate-600">{c.documento || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{c.telefono || '—'}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Gift className="h-3 w-3 mr-1" />{c.puntos}</Badge>
              </td>
              <td className="px-4 py-3 font-semibold tabular-nums text-teal-700">{fmtCOP(c.total_gastado)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{fmtFecha(c.ultima_visita)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setFicha(c)}><Eye className="h-4 w-4 text-teal-700" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => abrirEditar(c)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                  <Button size="sm" variant="ghost" onClick={async () => { if (confirm(`¿Eliminar a ${c.nombre}?`)) await app.eliminar('clientes', c.id); }}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </TablaSimple>
      )}

      {/* formulario crear/editar */}
      <DialogoFormulario abierto={!!dialogo} onCerrar={() => setDialogo(null)}
        titulo={dialogo === 'nuevo' ? 'Nuevo cliente' : 'Editar cliente'} onGuardar={guardar}>
        <div><CampoLabel requerido>Nombre completo</CampoLabel><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="min-h-11" placeholder="Juan Pérez" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel>Documento</CampoLabel><Input value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} className="min-h-11" /></div>
          <div><CampoLabel>Teléfono</CampoLabel><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="min-h-11" placeholder="3001234567" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel>WhatsApp</CampoLabel><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="min-h-11" placeholder="Igual al teléfono" /></div>
          <div><CampoLabel>Email</CampoLabel><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="min-h-11" /></div>
        </div>
        <div><CampoLabel>Dirección</CampoLabel><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="min-h-11" /></div>
        <div><CampoLabel>Observaciones</CampoLabel><Input value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className="min-h-11" placeholder="Alergias, preferencias…" /></div>
      </DialogoFormulario>

      {/* ficha con historial */}
      {ficha && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setFicha(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{ficha.nombre}</h3>
                <p className="text-sm text-slate-500">Cliente desde {fmtFecha(ficha.ultima_visita)} · {ficha.puntos} puntos</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFicha(null)}>✕</Button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="rounded-xl bg-teal-50 py-3"><p className="text-xs text-teal-600">Total gastado</p><p className="font-bold text-teal-800 text-sm">{fmtCOP(ficha.total_gastado)}</p></div>
              <div className="rounded-xl bg-amber-50 py-3"><p className="text-xs text-amber-600">Puntos</p><p className="font-bold text-amber-800 text-sm">{ficha.puntos}</p></div>
              <div className="rounded-xl bg-slate-50 py-3"><p className="text-xs text-slate-500">Vehículos</p><p className="font-bold text-slate-800 text-sm">{datos.vehiculos.filter(v => v.cliente_id === ficha.id).length}</p></div>
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-2">🚗🏍️ Historial de vehículos</p>
            <div className="space-y-2">
              {datos.vehiculos.filter(v => v.cliente_id === ficha.id).map(v => (
                <div key={v.id} className="rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{v.tipo === 'moto' ? '🏍️' : '🚗'} {v.marca} {v.modelo} <span className="text-slate-400">({v.placa})</span></p>
                    <Badge variant="outline">{v.lavados_acumulados} lavados</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Último lavado: {fmtFecha(v.ultimo_lavado)} · Gastado: {fmtCOP(v.total_gastado)}</p>
                </div>
              ))}
              {datos.vehiculos.filter(v => v.cliente_id === ficha.id).length === 0 && <p className="text-sm text-slate-400">Sin vehículos registrados</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

