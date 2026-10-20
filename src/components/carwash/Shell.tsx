'use client';

// Shell principal — login, onboarding, sidebar responsive y router por hash (#/modulo).

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useApp } from '@/lib/store';
import { MODULOS, GRUPOS, type Modulo } from '@/lib/nav';
import { fmtCOP } from '@/lib/format';
import {
  Car, LogOut, Menu, Sparkles, Mail, Lock, ArrowRight, Loader2, Building2,
  Smartphone, MonitorSmartphone, ShieldCheck,
} from 'lucide-react';

// Vistas cargadas de forma perezosa
import dynamic from 'next/dynamic';
const VISTAS: Record<string, React.ComponentType> = {
  dashboard: dynamic(() => import('./views/Dashboard'), { ssr: false }),
  ordenes: dynamic(() => import('./views/Ordenes'), { ssr: false }),
  clientes: dynamic(() => import('./views/Clientes'), { ssr: false }),
  vehiculos: dynamic(() => import('./views/Vehiculos'), { ssr: false }),
  servicios: dynamic(() => import('./views/Catalogos').then(m => ({ default: m.VistaServicios })), { ssr: false }),
  extras: dynamic(() => import('./views/Catalogos').then(m => ({ default: m.VistaExtras })), { ssr: false }),
  empleados: dynamic(() => import('./views/Empleados'), { ssr: false }),
  membresias: dynamic(() => import('./views/Catalogos').then(m => ({ default: m.VistaMembresias })), { ssr: false }),
  fidelizacion: dynamic(() => import('./views/Fidelizacion'), { ssr: false }),
  reservas: dynamic(() => import('./views/Reservas'), { ssr: false }),
  whatsapp: dynamic(() => import('./views/WhatsApp'), { ssr: false }),
  caja: dynamic(() => import('./views/Caja'), { ssr: false }),
  pagos: dynamic(() => import('./views/Pagos'), { ssr: false }),
  comisiones: dynamic(() => import('./views/Comisiones'), { ssr: false }),
  nomina: dynamic(() => import('./views/Nomina'), { ssr: false }),
  inventario: dynamic(() => import('./views/Inventario'), { ssr: false }),
  consumos: dynamic(() => import('./views/Consumos'), { ssr: false }),
  reportes: dynamic(() => import('./views/Reportes'), { ssr: false }),
  ia: dynamic(() => import('./views/IA'), { ssr: false }),
  configuracion: dynamic(() => import('./views/Configuracion'), { ssr: false }),
  reservar: dynamic(() => import('./views/ReservarPublico'), { ssr: false }),
};

export default function Shell() {
  const app = useApp();
  const { listo, emailSesion, empleado, organizacion } = app;
  const [ruta, setRuta] = useState('dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const leer = () => {
      const h = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
      setRuta(h);
    };
    leer();
    window.addEventListener('hashchange', leer);
    return () => window.removeEventListener('hashchange', leer);
  }, []);

  const ir = (id: string) => {
    window.location.hash = `/${id}`;
    setRuta(id);
    setMenuAbierto(false);
    window.scrollTo({ top: 0 });
  };

  if (!listo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Página pública de reservas — sin sesión
  if (ruta === 'reservar') {
    const Vista = VISTAS.reservar;
    return <div className="min-h-screen bg-slate-50"><Vista /></div>;
  }

  if (!emailSesion) {
    return <PantallaLogin />;
  }

  if (app.necesitaOrganizacion) {
    return <PantallaOnboarding />;
  }

  if (!organizacion || !empleado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Cargando tus datos…</p>
        </div>
      </div>
    );
  }

  const modulosPermitidos = MODULOS.filter(m => m.roles.includes(empleado.rol));
  const moduloActual = modulosPermitidos.find(m => m.id === ruta) ?? modulosPermitidos[0];
  const Vista = VISTAS[moduloActual.id] ?? VISTAS.dashboard;

  const Sidebar = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="h-9 w-9 rounded-xl bg-teal-500 flex items-center justify-center">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white leading-none">Carwash</p>
          <p className="text-[10px] text-teal-400 mt-0.5 truncate max-w-36">{organizacion.nombre}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {GRUPOS.map(grupo => {
          const mods = modulosPermitidos.filter(m => m.grupo === grupo);
          if (!mods.length) return null;
          return (
            <div key={grupo} className="mb-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 mb-1.5">{grupo}</p>
              {mods.map(m => (
                <button key={m.id} onClick={() => ir(m.id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11 ${
                    ruta === m.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30' : 'hover:bg-white/5 hover:text-white'
                  }`}>
                  <m.icono className="h-4 w-4 shrink-0" />
                  <span className="truncate">{m.etiqueta}</span>
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="rounded-xl bg-white/5 px-3 py-2.5 mb-2">
          <p className="text-xs text-slate-400">Sesión</p>
          <p className="text-sm font-medium text-white truncate">{emailSesion}</p>
          <Badge variant="outline" className="mt-1 bg-teal-500/10 text-teal-400 border-teal-500/30 capitalize text-[10px]">{empleado.rol}</Badge>
        </div>
        <button onClick={() => { app.cerrarSesion(); toast.success('Sesión cerrada'); }}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 min-h-10">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* sidebar escritorio */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-40">{Sidebar}</aside>

      {/* sidebar móvil */}
      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="p-0 w-72 border-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          {Sidebar}
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 h-16">
            <Button variant="ghost" size="icon" className="lg:hidden min-h-11 min-w-11" onClick={() => setMenuAbierto(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <moduloActual.icono className="h-5 w-5 text-teal-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 leading-none truncate">{moduloActual.etiqueta}</p>
                <p className="text-[11px] text-slate-400 truncate">{moduloActual.descripcion}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a href="#/reservar" className="hidden sm:block">
                <Button variant="outline" size="sm" className="min-h-9 text-teal-700 border-teal-200">
                  <Smartphone className="h-3.5 w-3.5 mr-1" /> Reservar cita
                </Button>
              </a>
              <Badge variant="outline" className="hidden md:flex bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="h-3 w-3 mr-1" /> {app.modo === 'demo' ? 'Demo' : 'Supabase'}
              </Badge>
            </div>
          </div>
        </header>

        {/* contenido */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <Vista />
          </div>
        </main>

        <footer className="mt-auto py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          Carwash · Sistema de gestión de lavaderos · {fmtCOP(0).replace(/[\d.,]/g, '').trim() || '$'} <span className="sr-only">footer</span>
          <span className="hidden sm:inline"> — Web y móvil · Next.js + Supabase</span>
        </footer>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );

  // ==================== login ====================
  function PantallaLogin() {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modoRegistro, setModoRegistro] = useState(false);

    const entrar = async () => {
      setCargando(true); setError(null);
      const err = modoRegistro ? await app.registrarse(email, pass) : await app.iniciarSesion(email, pass);
      setCargando(false);
      if (err) setError(err);
      else toast.success(modoRegistro ? 'Cuenta creada — revisa tu correo si requiere confirmación' : '¡Bienvenido! 👋');
    };

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-72 w-72 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 bg-sky-500/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative">
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-teal-500 items-center justify-center mb-4 shadow-xl shadow-teal-500/30">
              <Car className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Carwash</h1>
            <p className="text-slate-400 text-sm mt-1">Gestión integral de lavaderos · Web y móvil 🚗🏍️</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h2 className="font-bold text-slate-900 mb-4">{modoRegistro ? 'Crear cuenta de administrador' : 'Iniciar sesión'}</h2>
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 min-h-12" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} className="pl-9 min-h-12"
                  onKeyDown={e => e.key === 'Enter' && entrar()} />
              </div>
              {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
              <Button onClick={entrar} disabled={cargando} className="w-full bg-teal-600 hover:bg-teal-700 text-white min-h-12 text-base font-semibold">
                {cargando ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{modoRegistro ? 'Crear cuenta' : 'Entrar'} <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
              {!modoRegistro && (
                <Button variant="outline" onClick={() => { app.entrarDemo(); toast.info('Modo demo activado — datos de ejemplo 🎮'); }}
                  className="w-full min-h-11 border-teal-300 text-teal-700 hover:bg-teal-50">
                  <Sparkles className="h-4 w-4 mr-1" /> Probar modo demostración
                </Button>
              )}
              <p className="text-center text-xs text-slate-400">
                {modoRegistro ? '¿Ya tienes cuenta? ' : '¿Primera vez con Supabase conectado? '}
                <button className="text-teal-700 font-semibold" onClick={() => { setModoRegistro(!modoRegistro); setError(null); }}>
                  {modoRegistro ? 'Inicia sesión' : 'Regístrate'}
                </button>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            {[['📊', 'Dashboard'], ['📸', 'Fotos y órdenes'], ['🤖', 'IA + WhatsApp']].map(([e, t]) => (
              <div key={t} className="rounded-xl bg-white/5 border border-white/10 py-3 px-2">
                <p className="text-xl">{e}</p>
                <p className="text-[11px] text-slate-400 mt-1">{t}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1.5">
            <MonitorSmartphone className="h-3.5 w-3.5" /> Instalable en el celular (PWA) · Multi-organización · Next.js + Supabase
          </p>
        </div>
      </div>
    );
  }

  // ==================== onboarding (solo Supabase) ====================
  function PantallaOnboarding() {
    const [nombre, setNombre] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const crear = async () => {
      if (!nombre.trim()) return;
      setCargando(true);
      const err = await app.crearOrganizacion(nombre.trim());
      setCargando(false);
      if (err) setError(err);
      else toast.success('¡Organización creada! Catálogos sembrados automáticamente 🎉');
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-teal-500 items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Crea tu lavadero</h1>
          <p className="text-sm text-slate-500 mb-5">
            Se crearán automáticamente los catálogos: servicios, extras, métodos de pago, inventario, membresías y plantillas de WhatsApp.
          </p>
          <Input placeholder="Nombre del lavadero" value={nombre} onChange={e => setNombre(e.target.value)} className="min-h-12 mb-3"
            onKeyDown={e => e.key === 'Enter' && crear()} />
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <Button onClick={crear} disabled={cargando} className="w-full bg-teal-600 hover:bg-teal-700 text-white min-h-12">
            {cargando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Crear organización'}
          </Button>
          <button onClick={() => app.cerrarSesion()} className="w-full text-xs text-slate-400 mt-4 hover:text-slate-600">Cerrar sesión</button>
        </div>
      </div>
    );
  }
}

