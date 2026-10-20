'use client';

// Órdenes — recepción del vehículo, flujo de estados, fotos, extras, cobro y WhatsApp.
// Los diálogos viven a nivel de módulo para no perder estado al actualizarse los datos.

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Encabezado, BotonNuevo, Vacio, DialogoFormulario, CampoLabel, ErrorToasterTexto, TablaSimple,
} from '@/components/carwash/ui-bits';
import { useApp, type EntradaOrden } from '@/lib/store';
import { fmtCOP, fmtFechaHora, enlaceWhatsApp, reemplazarVariables } from '@/lib/format';
import { ESTADOS_ORDEN as ESTADOS, type EstadoOrden, type Orden, type OrdenFoto } from '@/lib/types';
import {
  Search, Camera, Trash2, MessageCircle, DollarSign, Play, CheckCircle2, PackageCheck,
  Image as ImageIcon, Plus,
} from 'lucide-react';

const POSICIONES = ['frontal', 'trasera', 'lateral_izquierda', 'lateral_derecha', 'interior'];

export default function Ordenes() {
  const app = useApp();
  const { datos, empleado } = app;
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [dialogoNueva, setDialogoNueva] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState<Orden | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esLavador = empleado?.rol === 'lavador';

  const ordenesVisibles = useMemo(() => {
    let lista = [...datos.ordenes].sort((a, b) => b.numero - a.numero);
    if (esLavador) lista = lista.filter(o => o.empleado_id === empleado?.id);
    if (filtroEstado !== 'todas') lista = lista.filter(o => o.estado === filtroEstado);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(o => {
        const v = datos.vehiculos.find(x => x.id === o.vehiculo_id);
        const c = datos.clientes.find(x => x.id === o.cliente_id);
        return String(o.numero).includes(q) || v?.placa.toLowerCase().includes(q) || c?.nombre.toLowerCase().includes(q);
      });
    }
    return lista;
  }, [datos, esLavador, empleado, filtroEstado, busqueda]);

  return (
    <div>
      <Encabezado titulo="Órdenes de servicio" subtitulo="Recepción, estados y cobro"
        accion={!esLavador ? <BotonNuevo texto="Nueva orden" onClick={() => setDialogoNueva(true)} /> : undefined} />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Buscar por número, placa o cliente…" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9 min-h-11" />
        </div>
        <SelectEstado valor={filtroEstado} onCambiar={setFiltroEstado} />
      </div>

      {ordenesVisibles.length === 0 ? (
        <Vacio mensaje="No hay órdenes que coincidan. Crea una nueva orden cuando llegue un cliente." />
      ) : (
        <TablaSimple encabezados={['#', 'Vehículo', 'Cliente', 'Servicio', 'Total', 'Estado', 'Entrada', '']}>
          {ordenesVisibles.slice(0, 100).map(o => {
            const v = datos.vehiculos.find(x => x.id === o.vehiculo_id);
            const c = datos.clientes.find(x => x.id === o.cliente_id);
            return (
              <tr key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setOrdenDetalle(o)}>
                <td className="px-4 py-3 font-semibold text-teal-700">#{String(o.numero).padStart(4, '0')}</td>
                <td className="px-4 py-3">{v?.placa} {v?.tipo === 'moto' ? '🏍️' : '🚗'}<span className="block text-xs text-slate-400">{v?.marca} {v?.modelo}</span></td>
                <td className="px-4 py-3">{c?.nombre}</td>
                <td className="px-4 py-3">{datos.servicios.find(s => s.id === o.servicio_id)?.nombre}</td>
                <td className="px-4 py-3 font-medium tabular-nums">{fmtCOP(o.total)}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="whitespace-nowrap capitalize">{o.estado.replace('_', ' ')}</Badge></td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtFechaHora(o.fecha_entrada)}</td>
                <td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-teal-700">Ver</Button></td>
              </tr>
            );
          })}
        </TablaSimple>
      )}

      <NuevaOrdenDialog abierto={dialogoNueva} onCerrar={() => setDialogoNueva(false)} onError={setError} />
      <DetalleOrden orden={ordenDetalle} onCerrar={() => setOrdenDetalle(null)} />
      <ErrorToasterTexto error={error} />
    </div>
  );
}

function SelectEstado({ valor, onCambiar }: { valor: string; onCambiar: (v: string) => void }) {
  return (
    <Select value={valor} onValueChange={onCambiar}>
      <SelectTrigger className="w-full sm:w-48 min-h-11"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todos los estados</SelectItem>
        {ESTADOS.map(e => <SelectItem key={e} value={e}>{e.replace('_', ' ')}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ========================= diálogo nueva orden (nivel módulo) =========================
function NuevaOrdenDialog({ abierto, onCerrar, onError }: {
  abierto: boolean; onCerrar: () => void; onError: (e: string | null) => void;
}) {
  const app = useApp();
  const { datos } = app;
  const [vehiculoId, setVehiculoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [empleadoId, setEmpleadoId] = useState('');
  const [extrasSel, setExtrasSel] = useState<Record<string, boolean>>({});
  const [observaciones, setObservaciones] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const servicio = datos.servicios.find(s => s.id === servicioId);
  const vehiculo = datos.vehiculos.find(v => v.id === vehiculoId);
  const extrasTotal = datos.servicios_adicionales.filter(a => extrasSel[a.id]).reduce((x, a) => x + a.precio, 0);

  const limpiar = () => { setVehiculoId(''); setServicioId(''); setEmpleadoId(''); setExtrasSel({}); setObservaciones(''); setKilometraje(''); };

  const guardar = async () => {
    if (!vehiculoId || !servicioId || !servicio) { onError('Selecciona vehículo y servicio'); return; }
    setGuardando(true);
    const entrada: EntradaOrden = {
      cliente_id: vehiculo!.cliente_id, vehiculo_id: vehiculoId, servicio_id: servicioId,
      empleado_id: empleadoId || null, precio_servicio: servicio.precio,
      extras: datos.servicios_adicionales.filter(a => extrasSel[a.id]).map(a => ({ adicional_id: a.id, nombre: a.nombre, precio: a.precio })),
      observaciones, kilometraje: kilometraje ? Number(kilometraje) : null,
    };
    const err = await app.crearOrden(entrada);
    setGuardando(false);
    onError(err);
    if (!err) { limpiar(); onCerrar(); }
  };

  return (
    <DialogoFormulario abierto={abierto} onCerrar={() => { limpiar(); onCerrar(); }} titulo="🚗 Nueva orden de servicio"
      descripcion="Registra la recepción del vehículo. Se generará la orden automáticamente." onGuardar={guardar} cargando={guardando} ancho="sm:max-w-xl">
      <div>
        <CampoLabel requerido>Vehículo</CampoLabel>
        <Select value={vehiculoId} onValueChange={setVehiculoId}>
          <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecciona un vehículo" /></SelectTrigger>
          <SelectContent>
            {datos.vehiculos.filter(v => v.activo).map(v => {
              const c = datos.clientes.find(x => x.id === v.cliente_id);
              return <SelectItem key={v.id} value={v.id}>{v.placa} · {v.tipo === 'moto' ? '🏍️' : '🚗'} {v.marca} {v.modelo} — {c?.nombre}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <CampoLabel requerido>Servicio</CampoLabel>
          <Select value={servicioId} onValueChange={setServicioId}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Servicio" /></SelectTrigger>
            <SelectContent>
              {datos.servicios.filter(s => s.activo && (!vehiculo || s.tipo_vehiculo === 'ambos' || s.tipo_vehiculo === vehiculo.tipo)).map(s => (
                <SelectItem key={s.id} value={s.id}>{s.nombre} ({s.tipo_vehiculo}) — {fmtCOP(s.precio)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <CampoLabel>Empleado asignado</CampoLabel>
          <Select value={empleadoId} onValueChange={setEmpleadoId}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Opcional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sin">Sin asignar</SelectItem>
              {datos.empleados.filter(e => e.activo).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.rol})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <CampoLabel>Servicios adicionales (aumentan el ticket)</CampoLabel>
        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 rounded-lg border border-slate-200">
          {datos.servicios_adicionales.filter(a => a.activo).map(a => (
            <label key={a.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs cursor-pointer transition-colors ${extrasSel[a.id] ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input type="checkbox" checked={!!extrasSel[a.id]} onChange={e => setExtrasSel(p => ({ ...p, [a.id]: e.target.checked }))} className="accent-teal-600" />
              <span className="truncate">{a.nombre}</span>
              <span className="ml-auto font-semibold whitespace-nowrap">{fmtCOP(a.precio)}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <CampoLabel>Kilometraje</CampoLabel>
          <Input type="number" value={kilometraje} onChange={e => setKilometraje(e.target.value)} placeholder="0" className="min-h-11" />
        </div>
        <div>
          <CampoLabel>Observaciones</CampoLabel>
          <Input value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Rayones, manchas…" className="min-h-11" />
        </div>
      </div>
      <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-teal-800">Total estimado</span>
        <span className="text-lg font-bold text-teal-700 tabular-nums">{fmtCOP((servicio?.precio ?? 0) + extrasTotal)}</span>
      </div>
    </DialogoFormulario>
  );
}

// ========================= detalle de orden (nivel módulo) =========================
function DetalleOrden({ orden, onCerrar }: { orden: Orden | null; onCerrar: () => void }) {
  const app = useApp();
  const { datos, organizacion } = app;
  const [extraSel, setExtraSel] = useState('');
  const [metodo, setMetodo] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  if (!orden) return null;
  const actual = datos.ordenes.find(o => o.id === orden.id) ?? orden;
  const v = datos.vehiculos.find(x => x.id === actual.vehiculo_id);
  const c = datos.clientes.find(x => x.id === actual.cliente_id);
  const s = datos.servicios.find(x => x.id === actual.servicio_id);
  const extras = datos.orden_extras.filter(x => x.orden_id === actual.id);
  const fotos: OrdenFoto[] = datos.orden_fotos.filter(x => x.orden_id === actual.id);
  const pagado = datos.pagos.some(p => p.orden_id === actual.id);
  const puedeCobrar = ['terminado', 'pagado', 'entregado'].includes(actual.estado) && !pagado;
  const plantilla = datos.whatsapp_plantillas.find(p => p.codigo === 'terminado');
  const msgTerminado = plantilla ? reemplazarVariables(plantilla.mensaje, {
    cliente: c?.nombre ?? '', vehiculo: `${v?.marca ?? ''} ${v?.modelo ?? ''}`, placa: v?.placa ?? '',
    organizacion: organizacion?.nombre ?? '', dias: 0, lavados: v?.lavados_acumulados ?? 0,
  }) : `Tu vehículo ${v?.placa} ya está listo`;

  const flujo: Array<{ estado: EstadoOrden; texto: string; icono: React.ReactNode }> = [
    { estado: 'en_proceso', texto: 'Iniciar', icono: <Play className="h-3.5 w-3.5" /> },
    { estado: 'terminado', texto: 'Terminar', icono: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { estado: 'pagado', texto: 'Pagado', icono: <DollarSign className="h-3.5 w-3.5" /> },
    { estado: 'entregado', texto: 'Entregar', icono: <PackageCheck className="h-3.5 w-3.5" /> },
  ];
  const idxActual = ESTADOS.indexOf(actual.estado);

  const cambiar = async (estado: EstadoOrden) => {
    setErrorLocal(await app.cambiarEstadoOrden(actual.id, estado));
  };

  const cobrar = async () => {
    if (!metodo) { setErrorLocal('Selecciona el método de pago'); return; }
    const err = await app.registrarPago({ orden_id: actual.id, metodo_id: metodo, monto: actual.total });
    setErrorLocal(err);
    if (!err) setMetodo('');
  };

  const agregarExtra = async () => {
    const a = datos.servicios_adicionales.find(x => x.id === extraSel);
    if (!a) return;
    await app.guardar('orden_extras', { orden_id: actual.id, adicional_id: a.id, nombre: a.nombre, precio: a.precio });
    await app.guardar('ordenes', { id: actual.id, total_extras: actual.total_extras + a.precio, total: actual.total + a.precio });
    setExtraSel('');
  };

  return (
    <Dialog open={!!orden} onOpenChange={op => !op && onCerrar()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
            Orden #{String(actual.numero).padStart(4, '0')}
            <Badge variant="outline" className="capitalize">{actual.estado.replace('_', ' ')}</Badge>
            {pagado && <Badge className="bg-teal-100 text-teal-700 border border-teal-200">Cobrada</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Info titulo="Cliente" valor={c?.nombre ?? '—'} />
          <Info titulo="Vehículo" valor={`${v?.marca ?? ''} ${v?.modelo ?? ''} · ${v?.placa ?? ''} ${v?.tipo === 'moto' ? '🏍️' : '🚗'}`} />
          <Info titulo="Servicio" valor={`${s?.nombre ?? ''} — ${fmtCOP(actual.precio_servicio)}`} />
          <Info titulo="Empleado" valor={datos.empleados.find(e => e.id === actual.empleado_id)?.nombre ?? 'Sin asignar'} />
          <Info titulo="Entrada" valor={fmtFechaHora(actual.fecha_entrada)} />
          <Info titulo="Observaciones" valor={actual.observaciones || '—'} />
        </div>

        {/* flujo de estados */}
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">FLUJO DE LA ORDEN</p>
          <div className="flex flex-wrap gap-2">
            {flujo.map(f => {
              const idxDestino = ESTADOS.indexOf(f.estado);
              const hecho = idxActual >= 0 && idxActual >= idxDestino && actual.estado !== 'recibido';
              const siguiente = idxDestino === idxActual + 1;
              return (
                <Button key={f.estado} size="sm" variant={hecho ? 'secondary' : siguiente ? 'default' : 'outline'}
                  disabled={hecho || (!siguiente && !hecho)}
                  className={`min-h-9 ${siguiente ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''} ${hecho ? 'opacity-60' : ''}`}
                  onClick={() => cambiar(f.estado)}>
                  {f.icono} {f.texto}{hecho ? ' ✓' : ''}
                </Button>
              );
            })}
            <Button size="sm" variant="outline" className="min-h-9 text-rose-600 border-rose-200" disabled={actual.estado === 'cancelado'}
              onClick={() => cambiar('cancelado')}>Cancelar</Button>
          </div>
        </div>

        {/* extras */}
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">SERVICIOS ADICIONALES</p>
          {extras.length > 0 && (
            <ul className="mb-2 space-y-1">
              {extras.map(e => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{e.nombre}</span>
                  <span className="flex items-center gap-2">
                    <b className="tabular-nums">{fmtCOP(e.precio)}</b>
                    <button className="text-rose-500 hover:text-rose-700" onClick={async () => {
                      await app.eliminar('orden_extras', e.id);
                      await app.guardar('ordenes', { id: actual.id, total_extras: actual.total_extras - e.precio, total: actual.total - e.precio });
                    }}><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Select value={extraSel} onValueChange={setExtraSel}>
              <SelectTrigger className="flex-1 min-h-10"><SelectValue placeholder="Agregar extra…" /></SelectTrigger>
              <SelectContent>
                {datos.servicios_adicionales.filter(a => a.activo && !extras.some(e => e.adicional_id === a.id)).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.nombre} — {fmtCOP(a.precio)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="min-h-10" onClick={agregarExtra}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* cobro */}
        {puedeCobrar && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
            <p className="text-xs font-semibold text-teal-700 mb-2">💰 COBRAR ORDEN</p>
            <div className="flex gap-2">
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger className="flex-1 min-h-10 bg-white"><SelectValue placeholder="Método de pago" /></SelectTrigger>
                <SelectContent>
                  {datos.metodos_pago.filter(m => m.activo).map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white min-h-10" onClick={cobrar}>
                Cobrar {fmtCOP(actual.total)}
              </Button>
            </div>
          </div>
        )}

        {/* fotos */}
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">📸 FOTOS DEL VEHÍCULO</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {POSICIONES.map(pos => (
              <label key={pos} className="cursor-pointer">
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setErrorLocal(await app.subirFoto(actual.id, 'entrada', pos, f));
                  setInputKey(k => k + 1);
                }} key={`entrada-${pos}-${inputKey}`} />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:border-teal-400 hover:text-teal-700">
                  <Camera className="h-3.5 w-3.5" /> {pos.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
          {fotos.length === 0 ? (
            <p className="text-xs text-slate-400 flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Sin fotos aún — tómalas al ingresar para evitar reclamos</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {fotos.map(f => (
                <div key={f.id} className="relative group">
                  <img src={f.url} alt={f.posicion ?? ''} className="h-20 w-full object-cover rounded-lg border border-slate-200" />
                  <button onClick={async () => { await app.eliminarFoto(f.id); }} className="absolute top-1 right-1 bg-white/90 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3 text-rose-600" />
                  </button>
                  <p className="text-[9px] text-center text-slate-400 mt-0.5">{f.fase} · {f.posicion?.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* whatsapp + total */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {c?.whatsapp && (
            <a href={enlaceWhatsApp(c.whatsapp, datos.configuraciones[0]?.whatsapp_pais ?? '57', msgTerminado)} target="_blank" rel="noreferrer">
              <Button variant="outline" className="text-emerald-700 border-emerald-200 min-h-10">
                <MessageCircle className="h-4 w-4 mr-1" /> Avisar por WhatsApp
              </Button>
            </a>
          )}
          <div className="text-right">
            <p className="text-xs text-slate-400">Total de la orden</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmtCOP(actual.total)}</p>
          </div>
        </div>
        <ErrorToasterTexto error={errorLocal} />
      </DialogContent>
    </Dialog>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{titulo}</p>
      <p className="text-sm text-slate-800 font-medium truncate">{valor}</p>
    </div>
  );
}

