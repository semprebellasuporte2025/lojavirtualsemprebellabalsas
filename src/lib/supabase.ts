
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis do Supabase não configuradas');
}

// Cliente principal (para todas as operações)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'semprebella-auth-token',
    // Configurações de tempo de sessão
    refreshTokenRotationEnabled: true,
    // Token expira em 2 horas (7200 segundos)
    expiresIn: 7200,
  },
  global: {
    headers: {
      'X-Client-Info': 'semprebella-admin',
    },
  },
  // Configurações de realtime para manter conexão ativa
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Tratamento de erros de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

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
    
    const { data, error } = await supabase
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
  id: number;
  nome: string;
  descricao: string;
  imagem_url: string;
  criado_em: string;
  ativo: boolean;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria_id: string;
  imagem_url: string;
  criado_em: string;
  ativo: boolean;
  // Flags de sessões especiais
  destaque?: boolean;
  recem_chegado?: boolean;
  // Campos opcionais utilizados na aplicação
  material?: string;
  imagens?: string[];
  preco_promocional?: number;
  preco_original?: number;
  desconto?: number;
  avaliacao?: number;
  total_avaliacoes?: number;
  estoque?: number;
  tamanhos?: string[];
  cores?: { name: string; hex: string }[];
  variantes_produto?: any[];
}
