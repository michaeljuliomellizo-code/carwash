// Utilidades de formato (Colombia / es-CO)

export const fmtCOP = (n: number | null | undefined) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(Number(n ?? 0));

export const fmtNum = (n: number | null | undefined, dec = 0) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: dec }).format(Number(n ?? 0));

export const fmtFecha = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fmtFechaHora = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const hoyISO = () => new Date().toISOString().slice(0, 10);

export const ahoraISO = () => new Date().toISOString();

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

export const ETIQUETA_ESTADO: Record<string, string> = {
  recibido: 'Recibido',
  en_proceso: 'En proceso',
  terminado: 'Terminado',
  pagado: 'Pagado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  abierta: 'Abierta',
  cerrada: 'Cerrada',
  activa: 'Activa',
  vencida: 'Vencida',
  abierto: 'Abierto',
  cerrado: 'Cerrado',
};

export const CLASE_ESTADO: Record<string, string> = {
  recibido: 'bg-amber-100 text-amber-800 border-amber-200',
  en_proceso: 'bg-sky-100 text-sky-800 border-sky-200',
  terminado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pagado: 'bg-teal-100 text-teal-800 border-teal-200',
  entregado: 'bg-slate-200 text-slate-700 border-slate-300',
  cancelado: 'bg-rose-100 text-rose-700 border-rose-200',
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmada: 'bg-sky-100 text-sky-800 border-sky-200',
  completada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  abierta: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cerrada: 'bg-slate-200 text-slate-700 border-slate-300',
  activa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  vencida: 'bg-rose-100 text-rose-700 border-rose-200',
  abierto: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cerrado: 'bg-slate-200 text-slate-700 border-slate-300',
};

export const ICONEstado: Record<string, string> = {
  recibido: '🟡', en_proceso: '🔵', terminado: '🟢', pagado: '💰', entregado: '⚫', cancelado: '❌',
};

// Comprime una imagen en el cliente antes de guardarla (DataURL) o subirla
export async function comprimirImagen(file: File, maxLado = 900, calidad = 0.72): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  return new Promise<string>(res => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      res(canvas.toDataURL('image/jpeg', calidad));
    };
    img.onerror = () => res(dataUrl);
    img.src = dataUrl;
  });
}

// Genera enlace de WhatsApp con texto prellenado
export const enlaceWhatsApp = (telefono: string | null | undefined, pais: string, texto: string) => {
  const num = (telefono || '').replace(/\D/g, '');
  return `https://wa.me/${pais}${num}?text=${encodeURIComponent(texto)}`;
};

export const reemplazarVariables = (
  plantilla: string,
  vars: Record<string, string | number>
) => plantilla.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

export const diasDesde = (iso?: string | null) => {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};
