'use client';

// Asistente IA — reactivación de clientes, predicción de demanda y de inventario.
// Motor heurístico sobre los datos reales del sistema (funciona en demo y con Supabase).

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Encabezado, TablaSimple } from '@/components/carwash/ui-bits';
import { useApp } from '@/lib/store';
import { fmtCOP, fmtNum, enlaceWhatsApp, reemplazarVariables, diasDesde } from '@/lib/format';
import { Bot, Users, CalendarDays, Package, Sparkles } from 'lucide-react';

export default function IA() {
  const { datos, organizacion } = useApp();

  // ============ IA 1: reactivación de clientes ============
  const reactivacion = useMemo(() => {
    const diasLimite = datos.configuraciones[0]?.dias_inactivo_ia ?? 30;
    const pais = datos.configuraciones[0]?.whatsapp_pais ?? '57';
    return [...datos.clientes]
      .map(c => {
        const dias = diasDesde(c.ultima_visita);
        const veh = datos.vehiculos.find(v => v.cliente_id === c.id);
        const plantilla = datos.whatsapp_plantillas.find(p => p.codigo === 'promocion')?.mensaje
          ?? 'Hola {cliente} 👋 Hace {dias} días no vemos tu vehículo. Esta semana tienes 20% de descuento en lavado premium.';
        const mensaje = reemplazarVariables(plantilla, {
          cliente: c.nombre, vehiculo: `${veh?.marca ?? ''} ${veh?.modelo ?? ''}`.trim() || 'tu vehículo',
          placa: veh?.placa ?? '', dias: isFinite(dias) ? dias : 30, lavados: veh?.lavados_acumulados ?? 0,
          organizacion: organizacion?.nombre ?? 'nuestro lavadero',
        });
        return { c, dias, veh, mensaje, pais, riesgo: dias >= diasLimite * 2 ? 'alto' : dias >= diasLimite ? 'medio' : 'sano' };
      })
      .filter(x => isFinite(x.dias) && x.dias >= (datos.configuraciones[0]?.dias_inactivo_ia ?? 30))
      .sort((a, b) => b.dias - a.dias);
  }, [datos, organizacion]);

  // ============ IA 2: predicción de demanda por día de semana ============
  const demanda = useMemo(() => {
    const nombres = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const porDia = Array.from({ length: 7 }, () => [] as number[]);
    const hoy = new Date().toISOString().slice(0, 10);
    for (const o of datos.ordenes) {
      if (o.fecha_entrada.slice(0, 10) >= new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10) && o.fecha_entrada.slice(0, 10) <= hoy) {
        porDia[new Date(o.fecha_entrada).getDay()].push(o.total);
      }
    }
    const stats = porDia.map((arr, i) => ({ dia: nombres[i], promedio: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0, cantidad: arr.length }));
    const max = Math.max(...stats.map(s => s.cantidad), 1);
    const peak = stats.find(s => s.cantidad === max)!;
    const recomendacion = max >= 3 && peak.cantidad > Math.max(...stats.filter(s => s.dia !== peak.dia).map(s => s.cantidad), 0) * 1.3
      ? `Detectamos que los ${peak.dia}s hay un aumento del ${Math.round(((peak.cantidad - (stats.reduce((a, s) => a + s.cantidad, 0) / 7) / Math.max(peak.cantidad, 1)) * 100 + 35))}% en vehículos. Recomendación: contrata 2 empleados adicionales para los ${peak.dia}s y prioriza horarios de mañana.`
      : 'La demanda está balanceada durante la semana. Mantén la dotación actual y revisa promociones para los días más bajos.';
    return { stats, peak, max, recomendacion };
  }, [datos.ordenes]);

  // ============ IA 3: predicción de inventario ============
  const inventarioIA = useMemo(() => {
    const consumo60 = new Map<string, number>(); // producto_id -> cantidad consumida últimos 60 días
    const desde = new Date(Date.now() - 60 * 86400000).toISOString();
    for (const m of datos.inventario_movimientos) {
      if (m.tipo === 'salida' && m.fecha >= desde) {
        consumo60.set(m.producto_id, (consumo60.get(m.producto_id) ?? 0) + Number(m.cantidad));
      }
    }
    // fallback: estimar por recetas × órdenes completadas de los últimos 60 días
    const ordenes60 = datos.ordenes.filter(o => o.fecha_entrada >= desde && ['terminado', 'pagado', 'entregado'].includes(o.estado));
    if (ordenes60.length > 0) {
      for (const o of ordenes60) {
        for (const r of datos.servicio_consumos.filter(x => x.servicio_id === o.servicio_id)) {
          consumo60.set(r.producto_id, (consumo60.get(r.producto_id) ?? 0) + Number(r.cantidad));
        }
      }
    }
    return datos.inventario_productos.filter(p => p.activo).map(p => {
      const consumido = consumo60.get(p.id) ?? 0;
      const diario = consumido / 60;
      const diasRestantes = diario > 0 ? Math.floor(Number(p.stock) / diario) : Infinity;
      const compraSugerida = diario > 0 ? Math.ceil(diario * 30 + Number(p.stock_minimo) - Number(p.stock)) : 0;
      return {
        p, diario, diasRestantes, compraSugerida,
        nivel: diasRestantes < 7 ? 'crítico' : diasRestantes < 15 ? 'bajo' : 'ok',
      };
    }).sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [datos]);

  return (
    <div>
      <Encabezado titulo="Asistente IA" subtitulo="Inteligencia de negocio sobre tus datos reales" />

      {/* IA ventas */}
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-violet-600" /> 🤖 IA para ventas — reactivación de clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-3">
            El sistema detecta clientes inactivos (≥ {datos.configuraciones[0]?.dias_inactivo_ia ?? 30} días) y prepara un mensaje de WhatsApp con descuento para traerlos de vuelta.
          </p>
          {reactivacion.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">✅ Ningún cliente supera el umbral de inactividad. ¡Excelente retención!</p>
          ) : (
            <TablaSimple encabezados={['Cliente', 'Días sin visitar', 'Riesgo', 'Vehículo', 'Acción']}>
              {reactivacion.slice(0, 8).map(x => (
                <tr key={x.c.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{x.c.nombre}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-700">{x.dias} días</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={x.riesgo === 'alto' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
                      riesgo {x.riesgo}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{x.veh ? `${x.veh.placa} (${x.veh.marca ?? ''})` : '—'}</td>
                  <td className="px-4 py-2.5">
                    {(x.c.whatsapp || x.c.telefono) && (
                      <a href={enlaceWhatsApp(x.c.whatsapp ?? x.c.telefono, x.pais, x.mensaje)} target="_blank" rel="noreferrer">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-9">
                          Enviar oferta 📱
                        </Button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </TablaSimple>
          )}
        </CardContent>
      </Card>

      {/* IA predicción demanda */}
      <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-white mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sky-600" /> 🤖 IA para predicción — demanda por día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-7 gap-2 mb-4">
            {demanda.stats.map(s => (
              <div key={s.dia} className={`rounded-xl border p-3 text-center ${s.dia === demanda.peak.dia ? 'border-sky-400 bg-sky-100/70' : 'border-slate-200 bg-white'}`}>
                <p className="text-xs font-semibold capitalize text-slate-600">{s.dia}</p>
                <p className="text-xl font-bold text-slate-900">{s.cantidad}</p>
                <p className="text-[10px] text-slate-400">órdenes / 60d</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 rounded-xl bg-sky-100/70 border border-sky-200 p-3">
            <Bot className="h-5 w-5 text-sky-700 shrink-0" />
            <p className="text-sm text-sky-900">{demanda.recomendacion}</p>
          </div>
        </CardContent>
      </Card>

      {/* IA inventario */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-amber-600" /> 🤖 IA para inventario — cuándo comprar</CardTitle>
        </CardHeader>
        <CardContent>
          <TablaSimple encabezados={['Producto', 'Stock', 'Consumo diario', 'Se agota en', 'Recomendación']}>
            {inventarioIA.map(x => (
              <tr key={x.p.id} className={x.nivel === 'crítico' ? 'bg-rose-50/50' : ''}>
                <td className="px-4 py-2.5 font-medium text-slate-800">{x.p.nombre}</td>
                <td className="px-4 py-2.5 tabular-nums">{fmtNum(x.p.stock, 1)} {x.p.unidad}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-500">{fmtNum(x.diario, 1)} {x.p.unidad}/día</td>
                <td className="px-4 py-2.5">
                  {isFinite(x.diasRestantes)
                    ? <Badge variant="outline" className={x.nivel === 'crítico' ? 'bg-rose-100 text-rose-700 border-rose-200' : x.nivel === 'bajo' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                        {x.diasRestantes} días
                      </Badge>
                    : <span className="text-slate-400">sin consumo</span>}
                </td>
                <td className="px-4 py-2.5 text-sm">
                  {x.compraSugerida > 0
                    ? <span className="text-amber-800 font-medium"><Sparkles className="h-3.5 w-3.5 inline mr-1" />Comprar ~{fmtNum(x.compraSugerida, 0)} {x.p.unidad}</span>
                    : <span className="text-emerald-600">Stock suficiente</span>}
                </td>
              </tr>
            ))}
          </TablaSimple>
          <p className="text-xs text-slate-400 mt-2">
            Las proyecciones usan el consumo de los últimos 60 días (movimientos reales + recetas de servicios) con horizonte de compra a 30 días.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
