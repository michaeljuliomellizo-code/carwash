'use client';

// Reserva pública — página tipo landing para que el cliente agende su cita sin sesión.

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/lib/store';
import { fmtCOP, uid } from '@/lib/format';
import { Car, CalendarClock, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function ReservarPublico() {
  const app = useApp();
  const { datos, organizacion, modo } = app;
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState('10:00');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const servicio = datos.servicios.find(s => s.id === servicioId);
  const enDemoSinSesion = modo === 'demo' && !app.emailSesion;

  const reservar = async () => {
    if (!nombre.trim() || !telefono.trim() || !servicioId) { setError('Completa nombre, teléfono y servicio'); return; }
    setGuardando(true);
    const nuevoCodigo = Math.random().toString(36).slice(2, 10).toUpperCase();
    const err = await app.guardar('reservas', {
      id: uid(), codigo: nuevoCodigo, nombre_visitante: nombre, telefono_visitante: telefono,
      servicio_id: servicioId, fecha, hora, notas, estado: 'pendiente',
    });
    setGuardando(false);
    if (err) { setError(err); return; }
    setCodigo(nuevoCodigo);
    toast.success('¡Reserva registrada! 🎉');
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-80 w-80 bg-teal-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 h-80 w-80 bg-sky-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-lg mx-auto p-4 py-10">
        {codigo ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-1">¡Reserva confirmada!</h1>
            <p className="text-sm text-slate-500 mb-4">Te esperamos el <b>{fecha}</b> a las <b>{hora}</b>. Guarda tu código:</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-teal-700 bg-teal-50 rounded-xl py-3 px-4 mb-5">{codigo}</p>
            <Button variant="outline" className="min-h-11" onClick={() => { setCodigo(null); setNombre(''); setTelefono(''); setNotas(''); }}>
              Hacer otra reserva
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-teal-500 items-center justify-center mb-3 shadow-xl shadow-teal-500/30">
                <Car className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">{organizacion?.nombre ?? 'Carwash'}</h1>
              <p className="text-slate-400 text-sm">Reserva tu lavado en 30 segundos 🚗🏍️</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-3">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-teal-600" /> Reservar lavado</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="min-h-12" />
                <Input placeholder="WhatsApp" value={telefono} onChange={e => setTelefono(e.target.value)} className="min-h-12" />
              </div>
              <Select value={servicioId} onValueChange={setServicioId}>
                <SelectTrigger className="min-h-12"><SelectValue placeholder="Selecciona el servicio" /></SelectTrigger>
                <SelectContent>
                  {datos.servicios.filter(s => s.activo).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.tipo_vehiculo === 'moto' ? '🏍️' : '🚗'} {s.nombre} — {fmtCOP(s.precio)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={fecha} min={new Date().toISOString().slice(0, 10)} onChange={e => setFecha(e.target.value)} className="min-h-12" />
                <Input type="time" value={hora} onChange={e => setHora(e.target.value)} className="min-h-12" />
              </div>
              <Input placeholder="Notas (opcional): barro, manchas…" value={notas} onChange={e => setNotas(e.target.value)} className="min-h-12" />
              {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
              {servicio && (
                <div className="flex items-center justify-between rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
                  <span className="text-sm font-medium text-teal-800">{servicio.nombre}</span>
                  <span className="font-bold text-teal-700">{fmtCOP(servicio.precio)}</span>
                </div>
              )}
              <Button onClick={reservar} disabled={guardando} className="w-full bg-teal-600 hover:bg-teal-700 text-white min-h-12 text-base font-semibold">
                {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar reserva'}
              </Button>
              {app.emailSesion && (
                <button onClick={() => { window.location.hash = '/dashboard'; }} className="w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-600 min-h-9">
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver al panel
                </button>
              )}
              {enDemoSinSesion && (
                <p className="text-[11px] text-slate-400 text-center">
                  Modo demostración — la reserva se guarda en los datos de ejemplo.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
