'use client';

// Componentes UI compartidos de Carwash

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ETIQUETA_ESTADO, CLASE_ESTADO } from '@/lib/format';
import { Inbox, Plus } from 'lucide-react';

export function TarjetaKPI({ titulo, valor, icono, detalle, tono = 'teal' }: {
  titulo: string; valor: string; icono: React.ReactNode; detalle?: string;
  tono?: 'teal' | 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';
}) {
  const tonos: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700', emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700', sky: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-700', slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">{titulo}</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 tabular-nums leading-tight break-all">{valor}</p>
            {detalle && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{detalle}</p>}
          </div>
          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${tonos[tono]}`}>{icono}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EtiquetaEstado({ estado }: { estado: string }) {
  return (
    <Badge variant="outline" className={`${CLASE_ESTADO[estado] ?? 'bg-slate-100 text-slate-700 border-slate-200'} font-medium whitespace-nowrap`}>
      {ETIQUETA_ESTADO[estado] ?? estado}
    </Badge>
  );
}

export function Encabezado({ titulo, subtitulo, accion }: { titulo: string; subtitulo?: string; accion?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">{titulo}</h1>
        {subtitulo && <p className="text-sm text-slate-500 mt-0.5">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}

export function BotonNuevo({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <Button onClick={onClick} className="bg-teal-600 hover:bg-teal-700 text-white min-h-11">
      <Plus className="h-4 w-4 mr-1" /> {texto}
    </Button>
  );
}

export function Vacio({ mensaje, icono }: { mensaje: string; icono?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        {icono ?? <Inbox className="h-7 w-7" />}
      </div>
      <p className="text-sm text-slate-500 max-w-xs">{mensaje}</p>
    </div>
  );
}

export function DialogoFormulario({ abierto, onCerrar, titulo, descripcion, children, onGuardar, cargando, ancho }: {
  abierto: boolean; onCerrar: () => void; titulo: string; descripcion?: string;
  children: React.ReactNode; onGuardar: () => void; cargando?: boolean; ancho?: string;
}) {
  return (
    <Dialog open={abierto} onOpenChange={v => !v && onCerrar()}>
      <DialogContent className={ancho ?? 'sm:max-w-lg max-h-[90vh] overflow-y-auto'}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3 py-1">{children}</div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCerrar} className="min-h-10">Cancelar</Button>
          <Button onClick={onGuardar} disabled={cargando} className="bg-teal-600 hover:bg-teal-700 text-white min-h-10">
            {cargando ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CampoLabel({ children, requerido }: { children: React.ReactNode; requerido?: boolean }) {
  return (
    <label className="text-xs font-medium text-slate-600 mb-1 block">
      {children} {requerido && <span className="text-rose-500">*</span>}
    </label>
  );
}

export function TablaSimple({ encabezados, children, vacio }: {
  encabezados: string[]; children: React.ReactNode; vacio?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {encabezados.map(e => (
                <th key={e} className="text-left font-semibold text-slate-600 px-4 py-3 whitespace-nowrap">{e}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
      {vacio && children === null && <Vacio mensaje={vacio} />}
    </div>
  );
}

export function ErrorToasterTexto({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>;
}
