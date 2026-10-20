'use client';

// Configuración — organización, parámetros del sistema y suscripciones de membresías.

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Encabezado, DialogoFormulario, CampoLabel, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtFecha, uid } from '@/lib/format';
import { Building2, Settings2, IdCard, Database, UserPlus, Trash2 } from 'lucide-react';

export default function Configuracion() {
  const app = useApp();
  const { datos, organizacion, modo } = app;
  const cfg = datos.configuraciones[0];
  const [org, setOrg] = useState({ nombre: organizacion?.nombre ?? '', telefono: '', direccion: '' });
  const [param, setParam] = useState({
    meta_diaria: String(cfg?.meta_diaria ?? 1000000),
    puntos_por_monto: String(cfg?.puntos_por_monto ?? 10000),
    dias_inactivo_ia: String(cfg?.dias_inactivo_ia ?? 30),
    whatsapp_pais: cfg?.whatsapp_pais ?? '57',
  });
  const [guardado, setGuardado] = useState<string | null>(null);
  const [dialogoSubs, setDialogoSubs] = useState(false);
  const [sub, setSub] = useState({ cliente_id: '', membresia_id: '' });

  const guardarOrg = async () => {
    if (!organizacion) return;
    const e = await app.guardar('organizaciones', { id: organizacion.id, nombre: org.nombre, telefono: org.telefono, direccion: org.direccion });
    setGuardado(e ?? 'Datos de la organización actualizados ✅');
    setTimeout(() => setGuardado(null), 3000);
  };

  const guardarParam = async () => {
    const e = await app.guardar('configuraciones', {
      organizacion_id: organizacion?.id ?? '',
      meta_diaria: Number(param.meta_diaria), puntos_por_monto: Number(param.puntos_por_monto),
      dias_inactivo_ia: Number(param.dias_inactivo_ia), whatsapp_pais: param.whatsapp_pais,
      ...(cfg ? { id: undefined } : {}),
    });
    setGuardado(e ?? 'Parámetros actualizados ✅');
    setTimeout(() => setGuardado(null), 3000);
  };

  const activarMembresia = async () => {
    const m = datos.membresias.find(x => x.id === sub.membresia_id);
    if (!m || !sub.cliente_id) return;
    const fin = new Date(Date.now() + m.vigencia_dias * 86400000).toISOString().slice(0, 10);
    await app.guardar('membresia_suscripciones', {
      id: uid(), membresia_id: m.id, cliente_id: sub.cliente_id,
      fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin: fin, lavados_usados: 0, estado: 'activa',
    });
    setDialogoSubs(false);
  };

  return (
    <div>
      <Encabezado titulo="Configuración" subtitulo="Organización, parámetros y suscripciones" />

      {guardado && <p className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{guardado}</p>}

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-600" /> Organización</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><CampoLabel>Nombre del lavadero</CampoLabel><Input value={org.nombre} onChange={e => setOrg({ ...org, nombre: e.target.value })} className="min-h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><CampoLabel>Teléfono</CampoLabel><Input value={org.telefono} onChange={e => setOrg({ ...org, telefono: e.target.value })} className="min-h-11" /></div>
              <div><CampoLabel>Dirección</CampoLabel><Input value={org.direccion} onChange={e => setOrg({ ...org, direccion: e.target.value })} className="min-h-11" /></div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                <Database className="h-3 w-3 mr-1" /> {modo === 'demo' ? 'Modo demo (localStorage)' : 'Supabase conectado'}
              </Badge>
              <Button onClick={guardarOrg} className="bg-teal-600 hover:bg-teal-700 text-white min-h-10">Guardar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4 text-teal-600" /> Parámetros del sistema</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><CampoLabel>Meta diaria de ventas (COP)</CampoLabel><Input type="number" value={param.meta_diaria} onChange={e => setParam({ ...param, meta_diaria: e.target.value })} className="min-h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><CampoLabel>Pesos por punto (fidelización)</CampoLabel><Input type="number" value={param.puntos_por_monto} onChange={e => setParam({ ...param, puntos_por_monto: e.target.value })} className="min-h-11" /></div>
              <div><CampoLabel>Días de inactividad (IA)</CampoLabel><Input type="number" value={param.dias_inactivo_ia} onChange={e => setParam({ ...param, dias_inactivo_ia: e.target.value })} className="min-h-11" /></div>
            </div>
            <div>
              <CampoLabel>Prefijo de país para WhatsApp</CampoLabel>
              <Select value={param.whatsapp_pais} onValueChange={v => setParam({ ...param, whatsapp_pais: v })}>
                <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="57">🇨🇴 Colombia (+57)</SelectItem>
                  <SelectItem value="51">🇵🇪 Perú (+51)</SelectItem>
                  <SelectItem value="52">🇲🇽 México (+52)</SelectItem>
                  <SelectItem value="34">🇪🇸 España (+34)</SelectItem>
                  <SelectItem value="1">🇺🇸 USA (+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={guardarParam} className="bg-teal-600 hover:bg-teal-700 text-white min-h-10 w-full">Guardar parámetros</Button>
          </CardContent>
        </Card>
      </div>

      {/* suscripciones de membresías */}
      <Card className="border-slate-200/80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><IdCard className="h-4 w-4 text-teal-600" /> Suscripciones activas</CardTitle>
            <Button size="sm" onClick={() => setDialogoSubs(true)} className="bg-teal-600 hover:bg-teal-700 text-white min-h-9">
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Activar membresía
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TablaSimple encabezados={['Cliente', 'Plan', 'Inicio', 'Vence', 'Lavados usados', 'Estado', '']}>
            {datos.membresia_suscripciones.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">Sin suscripciones activas</td></tr>
            ) : datos.membresia_suscripciones.map(s => {
              const c = datos.clientes.find(x => x.id === s.cliente_id);
              const m = datos.membresias.find(x => x.id === s.membresia_id);
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5">{m?.nombre} ({fmtCOP(m?.precio ?? 0)})</td>
                  <td className="px-4 py-2.5 text-slate-500">{fmtFecha(s.fecha_inicio)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{fmtFecha(s.fecha_fin)}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {m?.lavados_incluidos ? `${s.lavados_usados} / ${m.lavados_incluidos}` : `${s.lavados_usados} (ilimitados)`}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={s.estado === 'activa' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>{s.estado}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Button size="sm" variant="ghost" onClick={async () => { if (confirm('¿Cancelar suscripción?')) await app.guardar('membresia_suscripciones', { id: s.id, estado: 'cancelada' }); }}>
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </TablaSimple>
        </CardContent>
      </Card>

      <DialogoFormulario abierto={dialogoSubs} onCerrar={() => setDialogoSubs(false)} titulo="Activar membresía"
        descripcion="Asigna un plan mensual a un cliente." onGuardar={activarMembresia}>
        <div>
          <CampoLabel requerido>Cliente</CampoLabel>
          <Select value={sub.cliente_id} onValueChange={v => setSub({ ...sub, cliente_id: v })}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {datos.clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <CampoLabel requerido>Plan</CampoLabel>
          <Select value={sub.membresia_id} onValueChange={v => setSub({ ...sub, membresia_id: v })}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {datos.membresias.filter(m => m.activo).map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nombre} — {fmtCOP(m.precio)}/mes ({m.lavados_incluidos ?? 'ilimitados'} lavados)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DialogoFormulario>
    </div>
  );
}
