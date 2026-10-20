// Cliente Supabase — se activa solo si existen las variables de entorno.
// Sin variables, la app corre en MODO DEMO (datos locales de ejemplo).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(URL && KEY);

let _cliente: SupabaseClient | null = null;

export function clienteSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado) return null;
  if (!_cliente) {
    _cliente = createClient(URL!, KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return _cliente;
}
