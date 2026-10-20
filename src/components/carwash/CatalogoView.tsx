'use client';

// Vista de catálogo genérica (CRUD) reutilizada por varios módulos.

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Encabezado, BotonNuevo, Vacio, DialogoFormulario, CampoLabel, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP } from '@/lib/format';
import type { TablaDatos } from '@/lib/types';
import { Pencil, Trash2 } from 'lucide-react';

export interface Campo {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'moneda' | 'select' | 'switch' | 'textarea';
  opciones?: Array<{ value: string; label: string }>;
  requerido?: boolean;
  placeholder?: string;
  anchoCompleto?: boolean;
}

export interface Columna<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

export default function CatalogoView<T extends Record<string, unknown>>({
  tabla, titulo, subtitulo, textoBoton, campos, columnas, vacio, porDefecto,
}: {
  tabla: TablaDatos;
  titulo: string;
  subtitulo: string;
  textoBoton: string;
  campos: Campo[];
  columnas: Columna<T>[];
  vacio: string;
  porDefecto?: Record<string, unknown>;
}) {
  const app = useApp();
  const datos = app.datos[tabla] as unknown as T[];
  const [dialogo, setDialogo] = useState<T | 'nuevo' | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [cargando, setCargando] = useState(false);

  const activos = useMemo(() => datos, [datos]);

  const abrirNuevo = () => {
    const inicial: Record<string, unknown> = {};
    for (const c of campos) inicial[c.key] = c.tipo === 'switch' ? true : c.tipo === 'numero' || c.tipo === 'moneda' ? '' : '';
    setForm({ ...inicial, ...(porDefecto ?? {}) });
    setDialogo('nuevo');
  };

  const abrirEditar = (item: T) => {
    const inicial: Record<string, unknown> = {};
    for (const c of campos) inicial[c.key] = (item[c.key] ?? (c.tipo === 'switch' ? false : '')) as unknown;
    setForm(inicial);
    setDialogo(item);
  };

  const guardar = async () => {
    for (const c of campos) {
      if (c.requerido && (form[c.key] === '' || form[c.key] === undefined || form[c.key] === null)) return;
    }
    setCargando(true);
    const limpio: Record<string, unknown> = { ...(porDefecto ?? {}) };
    for (const c of campos) {
      const v = form[c.key];
      if (c.tipo === 'numero' || c.tipo === 'moneda') limpio[c.key] = v === '' || v === null ? 0 : Number(v);
      else limpio[c.key] = v;
    }
    if (dialogo && dialogo !== 'nuevo') limpio.id = (dialogo as T).id as string;
    await app.guardar(tabla, limpio);
    setCargando(false);
    setDialogo(null);
  };

  return (
    <div>
      <Encabezado titulo={titulo} subtitulo={subtitulo} accion={<BotonNuevo texto={textoBoton} onClick={abrirNuevo} />} />

      {activos.length === 0 ? (
        <Vacio mensaje={vacio} />
      ) : (
        <TablaSimple encabezados={[...columnas.map(c => c.label), '']}>
          {activos.map(item => (
            <tr key={String(item.id)} className="hover:bg-slate-50">
              {columnas.map(col => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(item) : <span className="text-slate-700">{String(item[col.key] ?? '—')}</span>}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex gap-1 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => abrirEditar(item)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    if (confirm('¿Eliminar este registro?')) await app.eliminar(tabla, String(item.id));
                  }}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </TablaSimple>
      )}

      <DialogoFormulario abierto={!!dialogo} onCerrar={() => setDialogo(null)}
        titulo={dialogo === 'nuevo' ? textoBoton : `Editar`} onGuardar={guardar} cargando={cargando}>
        {campos.map(c => (
          <div key={c.key} className={c.anchoCompleto ? '' : ''}>
            <CampoLabel requerido={c.requerido}>{c.label}</CampoLabel>
            {c.tipo === 'select' ? (
              <Select value={String(form[c.key] ?? '')} onValueChange={val => setForm(p => ({ ...p, [c.key]: val }))}>
                <SelectTrigger className="min-h-11"><SelectValue placeholder={c.placeholder ?? 'Selecciona…'} /></SelectTrigger>
                <SelectContent>
                  {c.opciones?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : c.tipo === 'switch' ? (
              <Switch checked={Boolean(form[c.key])} onCheckedChange={v => setForm(p => ({ ...p, [c.key]: v }))} className="data-[state=checked]:bg-teal-600" />
            ) : c.tipo === 'textarea' ? (
              <Textarea value={String(form[c.key] ?? '')} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))} placeholder={c.placeholder} className="min-h-20" />
            ) : (
              <Input
                type={c.tipo === 'numero' || c.tipo === 'moneda' ? 'number' : 'text'}
                value={String(form[c.key] ?? '')}
                onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                placeholder={c.placeholder}
                className="min-h-11"
              />
            )}
            {c.tipo === 'moneda' && form[c.key] !== '' && (
              <p className="text-xs text-teal-700 mt-1 font-medium">{fmtCOP(Number(form[c.key]))}</p>
            )}
          </div>
        ))}
      </DialogoFormulario>
    </div>
  );
}
