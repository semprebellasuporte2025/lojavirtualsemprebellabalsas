import { supabase } from './supabase';

const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Chave anônima do Supabase não configurada');
}

// Função para obter headers de autenticação
export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey
    };
  }
  
  return {
    'apikey': supabaseAnonKey
  };
};

// Wrapper para operações do Supabase com autenticação automática
export const supabaseWithAuth = supabase;

// Exportar também o cliente original para casos específicos
export { supabase as supabaseBase };