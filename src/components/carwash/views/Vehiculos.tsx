'use client';

// Vehículos — CRUD asociado a clientes con estadísticas de lavados.

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Encabezado, BotonNuevo, Vacio, DialogoFormulario, CampoLabel, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFecha } from '@/lib/format';
import type { Vehiculo } from '@/lib/types';
import { Search, Pencil, Trash2 } from 'lucide-react';

const VACIO = { cliente_id: '', placa: '', tipo: 'carro', marca: '', modelo: '', anio: '', color: '', kilometraje: '', observaciones: '' };

export default function Vehiculos() {
  const app = useApp();
  const { datos } = app;
  const [busqueda, setBusqueda] = useState('');
  const [dialogo, setDialogo] = useState<Vehiculo | 'nuevo' | null>(null);
  const [form, setForm] = useState<typeof VACIO>(VACIO);

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return datos.vehiculos.filter(v =>
      !q || v.placa.toLowerCase().includes(q) || (v.marca ?? '').toLowerCase().includes(q) || (v.modelo ?? '').toLowerCase().includes(q)
    );
  }, [datos.vehiculos, busqueda]);

  const abrirNuevo = () => { setForm(VACIO); setDialogo('nuevo'); };
  const abrirEditar = (v: Vehiculo) => {
    setForm({
      cliente_id: v.cliente_id, placa: v.placa, tipo: v.tipo, marca: v.marca ?? '', modelo: v.modelo ?? '',
      anio: v.anio ? String(v.anio) : '', color: v.color ?? '', kilometraje: v.kilometraje ? String(v.kilometraje) : '',
      observaciones: v.observaciones ?? '',
    });
    setDialogo(v);
  };

  const guardar = async () => {
    if (!form.placa.trim() || !form.cliente_id) return;
    const base = dialogo === 'nuevo' ? {} : { id: (dialogo as Vehiculo).id };
    await app.guardar('vehiculos', {
      ...base, cliente_id: form.cliente_id, placa: form.placa.toUpperCase(), tipo: form.tipo,
      marca: form.marca, modelo: form.modelo, anio: form.anio ? Number(form.anio) : null,
      color: form.color, kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
      observaciones: form.observaciones, activo: true,
    });
    setDialogo(null);
  };

  return (
    <div>
      <Encabezado titulo="Vehículos" subtitulo="Flota registrada con historial de lavados"
        accion={<BotonNuevo texto="Nuevo vehículo" onClick={abrirNuevo} />} />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Buscar por placa, marca o modelo…" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9 min-h-11" />
      </div>

      {lista.length === 0 ? (
        <Vacio mensaje="No hay vehículos registrados. Agrega el primero y asígnaolo a un cliente." />
      ) : (
        <TablaSimple encabezados={['Placa', 'Tipo', 'Marca / Modelo', 'Año', 'Color', 'Cliente', 'Lavados', 'Último lavado', 'Total gastado', '']}>
          {lista.map(v => {
            const c = datos.clientes.find(x => x.id === v.cliente_id);
            return (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-800">{v.placa}</td>
                <td className="px-4 py-3">{v.tipo === 'moto' ? '🏍️ Moto' : '🚗 Carro'}</td>
                <td className="px-4 py-3">{v.marca} {v.modelo}</td>
                <td className="px-4 py-3 text-slate-600">{v.anio || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{v.color || '—'}</td>
                <td className="px-4 py-3">{c?.nombre ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">{v.lavados_acumulados}</Badge></td>
                <td className="px-4 py-3 text-sm text-slate-500">{fmtFecha(v.ultimo_lavado)}</td>
                <td className="px-4 py-3 font-medium tabular-nums">{fmtCOP(v.total_gastado)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => abrirEditar(v)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                    <Button size="sm" variant="ghost" onClick={async () => { if (confirm(`¿Eliminar el vehículo ${v.placa}?`)) await app.eliminar('vehiculos', v.id); }}>
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </TablaSimple>
      )}

      <DialogoFormulario abierto={!!dialogo} onCerrar={() => setDialogo(null)}
        titulo={dialogo === 'nuevo' ? 'Nuevo vehículo' : 'Editar vehículo'} onGuardar={guardar}>
        <div>
          <CampoLabel requerido>Propietario (cliente)</CampoLabel>
          <Select value={form.cliente_id} onValueChange={val => setForm({ ...form, cliente_id: val })}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona el cliente" /></SelectTrigger>
            <SelectContent>
              {datos.clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel requerido>Placa</CampoLabel><Input value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })} className="min-h-11" placeholder="ABC123" /></div>
          <div>
            <CampoLabel requerido>Tipo</CampoLabel>
            <Select value={form.tipo} onValueChange={val => setForm({ ...form, tipo: val })}>
              <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="carro">🚗 Carro</SelectItem>
                <SelectItem value="moto">🏍️ Moto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel>Marca</CampoLabel><Input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className="min-h-11" placeholder="Chevrolet" /></div>
          <div><CampoLabel>Modelo</CampoLabel><Input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} className="min-h-11" placeholder="Onix" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><CampoLabel>Año</CampoLabel><Input type="number" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })} className="min-h-11" placeholder="2022" /></div>
          <div><CampoLabel>Color</CampoLabel><Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="min-h-11" placeholder="Blanco" /></div>
          <div><CampoLabel>Kilometraje</CampoLabel><Input type="number" value={form.kilometraje} onChange={e => setForm({ ...form, kilometraje: e.target.value })} className="min-h-11" /></div>
        </div>
        <div><CampoLabel>Observaciones</CampoLabel><Input value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className="min-h-11" placeholder="Rayón en puerta trasera…" /></div>
      </DialogoFormulario>
    </div>
  );
}
