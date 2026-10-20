'use client';

// Inventario — productos, stock con alertas de compra y movimientos.

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Encabezado, BotonNuevo, Vacio, DialogoFormulario, CampoLabel, TarjetaKPI, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtNum, fmtFechaHora, uid } from '@/lib/format';
import type { InventarioProducto } from '@/lib/types';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2, ShoppingCart } from 'lucide-react';

const VACIO = { nombre: '', unidad: 'ml', stock: '', stock_minimo: '', costo_unitario: '', proveedor: '' };

export default function Inventario() {
  const app = useApp();
  const { datos } = app;
  const [dialogo, setDialogo] = useState<InventarioProducto | 'nuevo' | null>(null);
  const [form, setForm] = useState<typeof VACIO>(VACIO);
  const [movimiento, setMovimiento] = useState<{ prod: InventarioProducto; tipo: 'entrada' | 'salida' | 'ajuste' } | null>(null);
  const [cant, setCant] = useState('');
  const [notas, setNotas] = useState('');

  const productos = useMemo(() => [...datos.inventario_productos].sort((a, b) => a.nombre.localeCompare(b.nombre)), [datos.inventario_productos]);
  const alertas = productos.filter(p => p.activo && p.stock < p.stock_minimo);
  const valorInventario = productos.reduce((a, p) => a + p.stock * p.costo_unitario, 0);

  const abrirNuevo = () => { setForm(VACIO); setDialogo('nuevo'); };
  const abrirEditar = (p: InventarioProducto) => {
    setForm({
      nombre: p.nombre, unidad: p.unidad, stock: String(p.stock), stock_minimo: String(p.stock_minimo),
      costo_unitario: String(p.costo_unitario), proveedor: p.proveedor ?? '',
    });
    setDialogo(p);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    const base = dialogo === 'nuevo' ? {} : { id: (dialogo as InventarioProducto).id };
    await app.guardar('inventario_productos', {
      ...base, nombre: form.nombre, unidad: form.unidad,
      stock: Number(form.stock || 0), stock_minimo: Number(form.stock_minimo || 0),
      costo_unitario: Number(form.costo_unitario || 0), proveedor: form.proveedor, activo: true,
    });
    setDialogo(null);
  };

  const registrarMovimiento = async () => {
    if (!movimiento || !cant) return;
    const n = Number(cant);
    await app.guardar('inventario_movimientos', {
      id: uid(), producto_id: movimiento.prod.id, tipo: movimiento.tipo,
      cantidad: movimiento.tipo === 'ajuste' ? n - movimiento.prod.stock : n,
      notas: notas || (movimiento.tipo === 'entrada' ? 'Compra' : 'Consumo manual'),
      fecha: new Date().toISOString(),
    });
    const nuevoStock = movimiento.tipo === 'entrada' ? movimiento.prod.stock + n
      : movimiento.tipo === 'salida' ? movimiento.prod.stock - n
      : n;
    await app.guardar('inventario_productos', { id: movimiento.prod.id, stock: nuevoStock });
    setMovimiento(null); setCant(''); setNotas('');
  };

  return (
    <div>
      <Encabezado titulo="Inventario" subtitulo="Productos, stock y alertas de compra"
        accion={<BotonNuevo texto="Nuevo producto" onClick={abrirNuevo} />} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <TarjetaKPI titulo="Productos" valor={String(productos.length)} icono={<Package className="h-5 w-5" />} tono="teal" />
        <TarjetaKPI titulo="Alertas de compra" valor={String(alertas.length)} icono={<AlertTriangle className="h-5 w-5" />} tono="rose" detalle={alertas.map(a => a.nombre).join(', ') || 'Ninguna'} />
        <TarjetaKPI titulo="Valor del inventario" valor={fmtCOP(valorInventario)} icono={<ShoppingCart className="h-5 w-5" />} tono="emerald" />
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="mb-3">
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          {productos.length === 0 ? (
            <Vacio mensaje="Sin productos. Agrega shampoo, cera, desengrasante, paños…" />
          ) : (
            <TablaSimple encabezados={['Producto', 'Stock', 'Mínimo', 'Costo unit.', 'Proveedor', 'Estado', '']}>
              {productos.map(p => {
                const bajo = p.stock < p.stock_minimo;
                return (
                  <tr key={p.id} className={bajo ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {bajo && '🔴 '}{p.nombre}
                      <span className="block text-xs text-slate-400">{p.unidad}</span>
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-slate-800">{fmtNum(p.stock, 1)} <span className="text-xs font-normal text-slate-400">{p.unidad}</span></td>
                    <td className="px-4 py-3 tabular-nums text-slate-500">{fmtNum(p.stock_minimo, 1)}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtCOP(p.costo_unitario)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.proveedor || '—'}</td>
                    <td className="px-4 py-3">
                      {bajo
                        ? <Badge className="bg-rose-100 text-rose-700 border border-rose-200">⚠️ Alerta de compra</Badge>
                        : <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">OK</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="min-h-9" onClick={() => setMovimiento({ prod: p, tipo: 'entrada' })}>
                          <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                        <Button size="sm" variant="outline" className="min-h-9" onClick={() => setMovimiento({ prod: p, tipo: 'salida' })}>
                          <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => abrirEditar(p)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                        <Button size="sm" variant="ghost" onClick={async () => { if (confirm(`¿Eliminar ${p.nombre}?`)) await app.eliminar('inventario_productos', p.id); }}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </TablaSimple>
          )}
        </TabsContent>

        <TabsContent value="movimientos">
          <TablaSimple encabezados={['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Notas']}>
            {datos.inventario_movimientos.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Sin movimientos registrados</td></tr>
            ) : [...datos.inventario_movimientos].reverse().slice(0, 60).map(m => {
              const p = datos.inventario_productos.find(x => x.id === m.producto_id);
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500">{fmtFechaHora(m.fecha)}</td>
                  <td className="px-4 py-2.5 font-medium">{p?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={m.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : m.tipo === 'salida' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-sky-50 text-sky-700 border-sky-200'}>
                      {m.tipo}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{fmtNum(m.cantidad, 1)} {p?.unidad}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-sm">{m.notas ?? '—'}</td>
                </tr>
              );
            })}
          </TablaSimple>
        </TabsContent>
      </Tabs>

      {/* formulario producto */}
      <DialogoFormulario abierto={!!dialogo} onCerrar={() => setDialogo(null)}
        titulo={dialogo === 'nuevo' ? 'Nuevo producto' : 'Editar producto'} onGuardar={guardar}>
        <div><CampoLabel requerido>Nombre</CampoLabel><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="min-h-11" placeholder="Shampoo" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CampoLabel>Unidad</CampoLabel>
            <Select value={form.unidad} onValueChange={v => setForm({ ...form, unidad: v })}>
              <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">ml</SelectItem><SelectItem value="l">litros</SelectItem>
                <SelectItem value="g">gramos</SelectItem><SelectItem value="unidad">unidad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><CampoLabel>Costo unitario (COP)</CampoLabel><Input type="number" value={form.costo_unitario} onChange={e => setForm({ ...form, costo_unitario: e.target.value })} className="min-h-11" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><CampoLabel>Stock actual</CampoLabel><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="min-h-11" /></div>
          <div><CampoLabel>Stock mínimo (alerta)</CampoLabel><Input type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} className="min-h-11" /></div>
        </div>
        <div><CampoLabel>Proveedor</CampoLabel><Input value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} className="min-h-11" /></div>
      </DialogoFormulario>

      {/* movimiento */}
      <DialogoFormulario abierto={!!movimiento} onCerrar={() => setMovimiento(null)}
        titulo={movimiento?.tipo === 'entrada' ? '📥 Entrada de inventario' : movimiento?.tipo === 'salida' ? '📤 Salida de inventario' : 'Ajuste'}
        descripcion={movimiento ? `${movimiento.prod.nombre} — stock actual: ${fmtNum(movimiento.prod.stock, 1)} ${movimiento.prod.unidad}` : ''}
        onGuardar={registrarMovimiento}>
        <div><CampoLabel requerido>Cantidad ({movimiento?.prod.unidad})</CampoLabel>
          <Input type="number" value={cant} onChange={e => setCant(e.target.value)} className="min-h-11" /></div>
        <div><CampoLabel>Notas</CampoLabel>
          <Input value={notas} onChange={e => setNotas(e.target.value)} className="min-h-11" placeholder="Compra a proveedor, consumo…" /></div>
      </DialogoFormulario>
    </div>
  );
}
