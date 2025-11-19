
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis do Supabase não configuradas');
}

// Singleton para evitar múltiplas instâncias do GoTrueClient sob o mesmo storageKey
declare global {
  // eslint-disable-next-line no-var
  var __semprebella_supabase__: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __semprebella_supabase_auth_listener__: boolean | undefined;
}

const getSingletonClient = (): SupabaseClient => {
  if (globalThis.__semprebella_supabase__) {
    return globalThis.__semprebella_supabase__;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: 'semprebella-auth-token',
    },
    // Removido header personalizado que pode causar problemas com Edge Functions
    global: {
      headers: {},
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  });

  globalThis.__semprebella_supabase__ = client;
  return client;
};

// Cliente principal (para todas as operações)
export const supabase = getSingletonClient();

// Tratamento de erros de autenticação
if (!globalThis.__semprebella_supabase_auth_listener__) {
  supabase.auth.onAuthStateChange((event, session) => {
    // marcar 'session' como usada para evitar aviso TS6133
    void session;
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  });
  globalThis.__semprebella_supabase_auth_listener__ = true;
}

// Função para limpar sessão inválida
export const clearInvalidSession = async () => {
  try {
    await supabase.auth.signOut();
    console.log('Sessão inválida limpa com sucesso');
  } catch (error) {
    console.error('Erro ao limpar sessão:', error);
  }
};

// Função para garantir sessão válida
export const ensureSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Erro ao verificar sessão:', error);
    throw new Error('Erro ao verificar sessão. Faça login novamente.');
  }
  
  if (!session) {
    console.warn('Nenhuma sessão ativa encontrada');
    throw new Error('Sem sessão. Faça login novamente.');
  }
  
  // Verificar atividade recente (2 horas)
  const lastActivity = localStorage.getItem('lastActivity');
  const now = Date.now();
  const twoHours = 2 * 60 * 60 * 1000; // 2 horas em millisegundos
  
  if (lastActivity && (now - parseInt(lastActivity)) > twoHours) {
    console.warn('Sessão expirada por inatividade (2h)');
    await clearInvalidSession();
    throw new Error('Sessão expirada por inatividade. Faça login novamente.');
  }
  
  // Verificar se o token não está expirado
  const now_seconds = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at < now_seconds) {
    console.warn('Token expirado');
    await clearInvalidSession();
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  
  // Atualizar última atividade
  localStorage.setItem('lastActivity', Date.now().toString());
  
  console.log('Sessão válida confirmada');
  return session;
};

// Função para inserir com timeout e abort controller
export const insertWithTimeout = async (table: string, payload: any, ms = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`Timeout de ${ms}ms atingido para inserção em ${table}`);
    controller.abort();
  }, ms);

  try {
    console.log(`[INSERT ${table}] Iniciando inserção...`);
    console.time(`[INSERT ${table}]`);
    
    const { data } = await supabase
      .from(table)
      .insert(payload)
      .select('*')
      .abortSignal(controller.signal)
      .throwOnError();
    
    console.timeEnd(`[INSERT ${table}]`);
    console.log(`✅ ${table} inserido:`, data);
    
    return data;
  } catch (error) {
    console.error(`❌ Erro ao inserir em ${table}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Tipos para o banco de dados
export interface Categoria {
  id: string; // uuid
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  ativa: boolean;
  created_at?: string;
  updated_at?: string;
  slug?: string | null;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria_id: string;
  imagem_url: string;
  created_at?: string;
  updated_at?: string;
  slug?: string | null;
  ativo: boolean;
  // Flags de sessões especiais
  destaque?: boolean;
  recem_chegado?: boolean;
  // Controle de visibilidade do nome
  nome_invisivel?: boolean;
  // Campos opcionais utilizados na aplicação
  material?: string;
  imagens?: string[];
  preco_promocional?: number;
  preco_original?: number;
  desconto?: number;
  avaliacao?: number;
  total_avaliacoes?: number;
  // Campos de rating provenientes da view 'products_with_ratings'
  average_rating?: number;
  review_count?: number;
  estoque?: number;
  tamanhos?: string[];
  cores?: { name: string; hex: string }[];
  variantes_produto?: any[];
  // Categoria associada (mapeada manualmente em algumas telas)
  categorias?: { id: string; nome: string };
}
