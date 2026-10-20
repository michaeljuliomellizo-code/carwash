'use client';

// Consumo por servicio — receta servicio→producto→cantidad, descontado automáticamente.

import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Encabezado, Vacio, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtNum, fmtCOP } from '@/lib/format';
import { Beaker, Trash2, Info } from 'lucide-react';

export default function Consumos() {
  const app = useApp();
  const { datos } = app;
  const [servicioId, setServicioId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');

  const recetas = useMemo(() => [...datos.servicio_consumos].sort((a, b) => a.servicio_id.localeCompare(b.servicio_id)), [datos.servicio_consumos]);

  const costoServicio = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of recetas) {
      const p = datos.inventario_productos.find(x => x.id === r.producto_id);
      mapa.set(r.servicio_id, (mapa.get(r.servicio_id) ?? 0) + Number(r.cantidad) * Number(p?.costo_unitario ?? 0));
    }
    return mapa;
  }, [recetas, datos.inventario_productos]);

  const agregar = async () => {
    if (!servicioId || !productoId || !cantidad) return;
    await app.guardar('servicio_consumos', { servicio_id: servicioId, producto_id: productoId, cantidad: Number(cantidad) });
    setCantidad('');
  };

  return (
    <div>
      <Encabezado titulo="Consumo por servicio" subtitulo="Define cuánto producto gasta cada servicio — el descuento es automático" />

      <Card className="border-sky-200 bg-sky-50/50 mb-4">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-sm text-sky-900">
            <b>Ejemplo:</b> si un <b>lavado básico</b> consume <b>100 ml de shampoo</b> y realizas <b>50 lavados</b>,
            el sistema descuenta automáticamente <b>5 litros</b> del inventario. Así sabes el costo real de cada servicio.
          </p>
        </CardContent>
      </Card>

      {/* agregar receta */}
      <Card className="border-slate-200/80 mb-6">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Nueva regla de consumo</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Select value={servicioId} onValueChange={setServicioId}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Servicio" /></SelectTrigger>
              <SelectContent>
                {datos.servicios.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} ({s.tipo_vehiculo})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={productoId} onValueChange={setProductoId}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Producto" /></SelectTrigger>
              <SelectContent>
                {datos.inventario_productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.unidad})</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cantidad" className="min-h-11" />
            <Button onClick={agregar} className="bg-teal-600 hover:bg-teal-700 text-white min-h-11"><Beaker className="h-4 w-4 mr-1" /> Agregar</Button>
          </div>
        </CardContent>
      </Card>

      {/* costo por servicio */}
      <p className="text-sm font-semibold text-slate-700 mb-2">💰 Costo de insumos por servicio</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {datos.servicios.map(s => {
          const costo = costoServicio.get(s.id) ?? 0;
          return (
            <Card key={s.id} className="border-slate-200/80">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-800 truncate">{s.nombre} <span className="text-slate-400">({s.tipo_vehiculo})</span></p>
                <p className="text-lg font-bold text-slate-900 mt-1">{fmtCOP(s.precio)}</p>
                <p className="text-xs text-slate-500">Costo insumos: <b className={costo > 0 ? 'text-amber-600' : ''}>{fmtCOP(costo)}</b></p>
                <p className="text-xs text-emerald-700 font-semibold">
                  Margen: {fmtCOP(s.precio - costo)} ({s.precio > 0 ? Math.round(((s.precio - costo) / s.precio) * 100) : 0}%)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recetas.length === 0 ? (
        <Vacio mensaje="Aún no hay reglas de consumo. Agrega la primera arriba." icono={<Beaker className="h-7 w-7" />} />
      ) : (
        <TablaSimple encabezados={['Servicio', 'Producto', 'Cantidad', '']}>
          {recetas.map(r => {
            const s = datos.servicios.find(x => x.id === r.servicio_id);
            const p = datos.inventario_productos.find(x => x.id === r.producto_id);
            return (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{s?.nombre ?? '—'} <span className="text-xs text-slate-400">({s?.tipo_vehiculo})</span></td>
                <td className="px-4 py-2.5">{p?.nombre ?? '—'}</td>
                <td className="px-4 py-2.5 tabular-nums">{fmtNum(r.cantidad, 1)} {p?.unidad}</td>
                <td className="px-4 py-2.5">
                  <Button size="sm" variant="ghost" onClick={async () => { if (confirm('¿Eliminar regla de consumo?')) await app.eliminar('servicio_consumos', r.id); }}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </TablaSimple>
      )}
    </div>
  );
}
