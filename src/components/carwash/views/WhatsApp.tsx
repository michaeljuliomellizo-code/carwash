'use client';

// WhatsApp — plantillas con variables, generación de mensajes y envío directo.

import { useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Encabezado, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { enlaceWhatsApp, reemplazarVariables, diasDesde, fmtFecha } from '@/lib/format';
import type { WhatsappPlantilla } from '@/lib/types';
import { MessageCircle, Send, Save, Bot } from 'lucide-react';

const CODIGOS = [
  { value: 'recepcion', label: '🚗 Recepción del vehículo' },
  { value: 'terminado', label: '✅ Vehículo terminado' },
  { value: 'promocion', label: '📢 Promoción / reactivación' },
  { value: 'fidelizacion', label: '🎉 Fidelización' },
];

export default function WhatsApp() {
  const app = useApp();
  const { datos } = app;
  const [editando, setEditando] = useState<WhatsappPlantilla | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [codigo, setCodigo] = useState('promocion');

  const clientesInactivos = useMemo(() =>
    [...datos.clientes]
      .map(c => ({ c, dias: diasDesde(c.ultima_visita) }))
      .filter(x => x.c.activo && isFinite(x.dias))
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 12),
    [datos.clientes]);

  const plantillaActual = datos.whatsapp_plantillas.find(p => p.codigo === codigo) ?? null;
  const clienteSel = datos.clientes.find(c => c.id === clienteId) ?? null;
  const vehCliente = datos.vehiculos.find(v => v.cliente_id === clienteId);

  const preview = useMemo(() => {
    if (!clienteSel) return plantillaActual?.mensaje ?? '';
    return reemplazarVariables(plantillaActual?.mensaje ?? '', {
      cliente: clienteSel.nombre,
      vehiculo: `${vehCliente?.marca ?? ''} ${vehCliente?.modelo ?? ''}`.trim() || 'vehículo',
      placa: vehCliente?.placa ?? '',
      organizacion: 'nuestro lavadero',
      dias: diasDesde(clienteSel.ultima_visita) || 0,
      lavados: vehCliente?.lavados_acumulados ?? 0,
    });
  }, [plantillaActual, clienteSel, vehCliente]);

  const guardarPlantilla = async () => {
    if (!editando || !mensaje.trim()) return;
    await app.guardar('whatsapp_plantillas', { id: editando.id, codigo: editando.codigo, mensaje, activo: true });
    setEditando(null);
  };

  const mensajeIA = useMemo(() => {
    if (!clienteSel) return '';
    const dias = diasDesde(clienteSel.ultima_visita);
    return `Hola ${clienteSel.nombre} 👋 Hace ${dias} días no vemos tu ${vehCliente?.marca ?? 'vehículo'} (${vehCliente?.placa ?? ''}). ¡Te extrañamos! Esta semana tienes un 20% de descuento en lavado premium. — Lavadero`;
  }, [clienteSel, vehCliente]);

  return (
    <div>
      <Encabezado titulo="WhatsApp" subtitulo="Mensajes automáticos y campañas de reactivación" />

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* plantillas */}
        <Card className="border-slate-200/80">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">📝 Plantillas configuradas</p>
            <div className="space-y-2">
              {datos.whatsapp_plantillas.map(p => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-teal-700">
                      {CODIGOS.find(c => c.value === p.codigo)?.label ?? p.codigo}
                    </span>
                    <Button size="sm" variant="ghost" className="min-h-8" onClick={() => { setEditando(p); setMensaje(p.mensaje); }}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{p.mensaje}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Variables disponibles: <code className="bg-slate-100 rounded px-1">{`{cliente} {vehiculo} {placa} {dias} {lavados} {organizacion}`}</code>
            </p>
          </CardContent>
        </Card>

        {/* generador */}
        <Card className="border-slate-200/80">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">🚀 Enviar mensaje ahora</p>
            <div className="space-y-3">
              <Select value={codigo} onValueChange={setCodigo}>
                <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{CODIGOS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona un cliente…" /></SelectTrigger>
                <SelectContent>
                  {datos.clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} · {c.telefono ?? 'sin teléfono'}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 min-h-24">
                <p className="text-sm text-emerald-900 whitespace-pre-wrap">{preview || 'La vista previa del mensaje aparecerá aquí…'}</p>
              </div>
              <a href={clienteSel?.whatsapp || clienteSel?.telefono
                ? enlaceWhatsApp(clienteSel?.whatsapp ?? clienteSel?.telefono, datos.configuraciones[0]?.whatsapp_pais ?? '57', preview)
                : undefined} target="_blank" rel="noreferrer">
                <Button disabled={!clienteSel} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-11">
                  <Send className="h-4 w-4 mr-1" /> Abrir en WhatsApp
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IA reactivación */}
      <Card className="border-violet-200 bg-violet-50/40">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-violet-900 flex items-center gap-2 mb-1">
            <Bot className="h-4 w-4" /> 🤖 Clientes inactivos — campaña de reactivación
          </p>
          <p className="text-xs text-violet-600 mb-3">El sistema detecta quiénes llevan más tiempo sin visitar y sugiere un mensaje con descuento.</p>
          <TablaSimple encabezados={['Cliente', 'Última visita', 'Días inactivo', 'Teléfono', '']}>
            {clientesInactivos.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">Sin datos de clientes</td></tr>
            ) : clientesInactivos.map(({ c, dias }) => (
              <tr key={c.id} className={dias > 30 ? 'bg-rose-50/50' : ''}>
                <td className="px-4 py-2.5 font-medium text-slate-800">{c.nombre}</td>
                <td className="px-4 py-2.5 text-slate-500">{fmtFecha(c.ultima_visita)}</td>
                <td className="px-4 py-2.5">
                  <span className={`font-bold ${dias > 30 ? 'text-rose-600' : 'text-slate-600'}`}>{isFinite(dias) ? `${dias} días` : 'Nunca'}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.whatsapp ?? c.telefono ?? '—'}</td>
                <td className="px-4 py-2.5">
                  {(c.whatsapp || c.telefono) && (
                    <a href={enlaceWhatsApp(c.whatsapp ?? c.telefono, datos.configuraciones[0]?.whatsapp_pais ?? '57',
                      reemplazarVariables(datos.whatsapp_plantillas.find(p => p.codigo === 'promocion')?.mensaje ?? '', {
                        cliente: c.nombre, vehiculo: 'vehículo', placa: '', organizacion: 'nuestro lavadero',
                        dias, lavados: datos.vehiculos.find(v => v.cliente_id === c.id)?.lavados_acumulados ?? 0,
                      }))}
                      target="_blank" rel="noreferrer">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-9">
                        <MessageCircle className="h-3.5 w-3.5 mr-1" /> Reactivar
                      </Button>
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </TablaSimple>
          {clienteSel && mensajeIA && (
            <p className="text-xs text-violet-500 mt-2">Sugerencia para {clienteSel.nombre}: “{mensajeIA}”</p>
          )}
        </CardContent>
      </Card>

      {/* editar plantilla */}
      {editando && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 mb-1">Editar plantilla</h3>
            <p className="text-xs text-slate-500 mb-3">{CODIGOS.find(c => c.value === editando.codigo)?.label}</p>
            <Textarea value={mensaje} onChange={e => setMensaje(e.target.value)} className="min-h-32 text-sm" />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" className="min-h-10" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white min-h-10" onClick={guardarPlantilla}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
