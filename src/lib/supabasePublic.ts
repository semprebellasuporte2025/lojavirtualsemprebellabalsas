import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis do Supabase não configuradas');
}

// Cliente público: não persiste sessão nem envia Authorization, apenas apikey
// Evitar múltiplas instâncias em HMR: reutiliza cliente em globalThis
const g: any = globalThis as any;
if (!g.__supabasePublic) {
  g.__supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      // Definir storageKey único para evitar aviso de múltiplos GoTrueClient
      storageKey: 'semprebella-public-auth',
    },
    global: {
      headers: {
        'X-Client-Info': 'semprebella-public',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  });
}

export const supabasePublic = g.__supabasePublic;