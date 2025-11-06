
import { useState, useEffect, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminName?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    adminName: undefined,
  });
  
  // Marcadores aceitos para perfis administradores
  const ADMIN_LABELS = ['admin', 'administrador', 'super_admin', 'superadmin', 'administrator'];
  
  // Referência para o cache que pode ser limpo externamente
  const adminCheckCacheRef = useRef<{[key: string]: {result: any, timestamp: number}}>({});
  // Promessas em andamento por chave (evita retornos falsos em corrida)
  const adminCheckPromisesRef = useRef<{[key: string]: Promise<{isAdmin: boolean, adminName?: string}>}>({});

  // Referência para o estado atual de auth (acessível em callbacks)
  const authStateRef = useRef(authState);

  // Manter a referência sincronizada com mudanças de estado
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  useEffect(() => {
    let mounted = true;
    // Removido boolean de corrida; usamos promessas compartilhadas
    let safetyTimer: number | null = null;
    let activityTimer: number | null = null;
    // Usar sempre a referência atual do cache (não criar cópia local)

    // Sistema de detecção de atividade para manter sessão ativa
    const updateLastActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const checkActivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000; // 2 horas em millisegundos
      
      if (lastActivity && (now - parseInt(lastActivity)) > twoHours) {
        console.log('[Auth] Sessão expirada por inatividade (2h)');
        supabase.auth.signOut();
        return false;
      }
      return true;
    };

    // Eventos para detectar atividade do usuário
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateLastActivity();
    };

    // Adicionar listeners de atividade
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Verificar atividade a cada 5 minutos
    activityTimer = window.setInterval(() => {
      if (mounted && authState.user) {
        checkActivity();
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Inicializar última atividade
    updateLastActivity();

    const checkAdminStatus = async (userId: string, email?: string): Promise<{isAdmin: boolean, adminName?: string}> => {
      const cacheKey = `${userId}:${email || ''}`;
      
      // Verificar cache primeiro (5 minutos de validade)
      const cached = adminCheckCacheRef.current[cacheKey];
      if (cached && (Date.now() - cached.timestamp) < 300000) {
        console.log('[Auth] Cache hit para verificação admin');
        return cached.result;
      }
      
      // Verificar se já existe uma promessa em andamento para este usuário
      const ongoing = adminCheckPromisesRef.current[cacheKey];
      if (ongoing) {
        console.log('[Auth] Verificação admin compartilhada em andamento, aguardando promessa...');
        return await ongoing;
      }
      
      try {
        console.log('[Auth] Verificando status admin para userId/email:', userId, email);
        
        // Timeout reduzido para 5 segundos (era 10)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na verificação admin')), 5000);
        });
        
        // Cria promessa compartilhada e armazena
        const verificationPromise = (async () => {
          const selectCols = 'id, user_id, email, nome, role, tipo, ativo';
          
          // Consulta única otimizada usando OR para verificar múltiplos critérios
          const query = supabase
            .from('usuarios_admin')
            .select(selectCols)
            .or(`user_id.eq.${userId},id.eq.${userId}${email ? ',email.eq.' + email.toLowerCase() : ''}`)
            .eq('ativo', true)
            .limit(1);
          
          const { data: adminData, error } = await Promise.race([query, timeoutPromise]) as any;
          
          if (error) {
            console.error('[Auth] Erro na consulta admin:', error);
            return {isAdmin: false};
          }
          
          const adminRecord = Array.isArray(adminData) ? adminData[0] : adminData;
          
          const isAdminResolved = !!adminRecord && ([adminRecord.role, adminRecord.tipo]
            .map(v => String(v ?? '').toLowerCase())
            .some(v => ADMIN_LABELS.includes(v))
          );

          const result = {
            isAdmin: isAdminResolved,
            adminName: adminRecord?.nome
          };

          // Armazenar no cache
          adminCheckCacheRef.current[cacheKey] = {
            result,
            timestamp: Date.now()
          };
          console.log('[Auth] Resultado verificação admin:', result);
          return result;
        })();

        adminCheckPromisesRef.current[cacheKey] = verificationPromise;
        const finalResult = await verificationPromise;
        // Limpa a promessa após resolver
        delete adminCheckPromisesRef.current[cacheKey];
        return finalResult;
      } catch (error) {
        console.error('[Auth] Erro na verificação admin:', error);
        // Em erro, não alternar o estado para falso imediatamente; apenas propagar falso sem cache
        // para evitar thrash em casos intermitentes.
        return {isAdmin: false};
      }
    };

    // Timer de segurança para garantir que loading termine
    safetyTimer = window.setTimeout(() => {
      if (mounted) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 12000);

    // Verificar sessão atual
    // Helper: formata nome em Title Case simples
    const toTitleCase = (s: string) => {
      return s
        .split(/\s+/)
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
    };

    // Helper: calcula o nome de exibição a partir do adminStatus ou metadados do usuário
    const computeDisplayName = (usr: User | null, adminStatus?: { adminName?: string }) => {
      const meta = (usr as any)?.user_metadata || {};
      const raw = (adminStatus?.adminName
        || meta.name
        || meta.full_name
        || meta.nome
        || meta.display_name
        || meta.first_name && meta.last_name && `${meta.first_name} ${meta.last_name}`
        || meta.first_name
        || '') as string;
      const fallbackEmail = (usr?.email || '').split('@')[0];
      const resolved = (raw && raw.trim().length > 0) ? raw.trim() : fallbackEmail;
      return resolved ? toTitleCase(String(resolved)) : undefined;
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          const adminStatus = await checkAdminStatus(session.user.id, session.user.email);
          const displayName = computeDisplayName(session.user, adminStatus);
          if (safetyTimer) clearTimeout(safetyTimer);
          setAuthState({
            user: session.user,
            session,
            loading: false,
            isAdmin: adminStatus.isAdmin || session.user.email === 'semprebellasuporte2025@gmail.com',
            adminName: displayName,
          });
        } else {
          if (safetyTimer) clearTimeout(safetyTimer);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAdmin: false,
            adminName: undefined,
          });
        }
      } catch (error) {
        console.error('Erro na verificação de sessão:', error);
        if (safetyTimer) clearTimeout(safetyTimer);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAdmin: false,
          adminName: undefined,
        });
      }
    };

    initAuth();
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Só logar mudanças de estado quando não for INITIAL_SESSION sem usuário
        if (!(event === 'INITIAL_SESSION' && !session?.user)) {
          console.log('[Auth] Estado mudou:', event, session?.user?.email);
        }

        if (!mounted) return;

        // Evitar logout desnecessário em eventos de refresh de token
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('[Auth] Token refreshed, mantendo usuário logado');
          return;
        }

        // Evitar processamento duplicado para o mesmo usuário
        const currentState = authStateRef.current;
        if (session?.user && currentState.user?.id === session.user.id && currentState.isAdmin !== undefined) {
          console.log('[Auth] Usuário já processado, pulando verificação');
          return;
        }

        // Ignorar INITIAL_SESSION se já temos usuário carregado
        if (event === 'INITIAL_SESSION' && currentState.user?.id && session?.user?.id === currentState.user.id) {
          console.log('[Auth] INITIAL_SESSION ignorado, usuário já carregado');
          return;
        }

        if (session?.user) {
          console.log('[Auth] Processando login para:', session.user.email);
          
          try {
            const adminStatus = await checkAdminStatus(session.user.id, session.user.email);
            console.log('[Auth] Status admin verificado:', adminStatus);
            
            const displayName = computeDisplayName(session.user, adminStatus);
            
            setAuthState({
              user: session.user,
              session,
              loading: false,
              isAdmin: adminStatus.isAdmin || session.user.email === 'semprebellasuporte2025@gmail.com',
              adminName: displayName,
            });
            
            console.log('[Auth] ✅ Estado atualizado com sucesso');
          } catch (error) {
            console.error('[Auth] Erro ao verificar status admin:', error);
            // Mesmo com erro, manter o usuário logado
            setAuthState({
              user: session.user,
              session,
              loading: false,
              isAdmin: false,
              adminName: undefined,
            });
          }
        } else {
          // Só fazer logout se realmente não houver sessão
          if (event === 'SIGNED_OUT') {
            console.log('[Auth] Usuário deslogado');
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isAdmin: false,
              adminName: undefined,
            });
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (activityTimer) clearInterval(activityTimer);
      
      // Remover listeners de atividade
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Iniciando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[Auth] Erro no login:', error);
        return { data: null, error };
      }
      
      console.log('[Auth] Login bem-sucedido');
      return { data, error: null };
    } catch (error) {
      console.error('[Auth] Erro no signIn:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user && !error) {
      await supabase
        .from('clientes')
        .insert({
          user_id: data.user.id,
          nome: userData.nome,
          email: email,
          telefone: userData.telefone,
          cpf: userData.cpf,
        });
    }

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Função para limpar o cache de verificação de administrador
  const clearAdminCache = () => {
    const cache = adminCheckCacheRef.current;
    for (const k of Object.keys(cache)) delete cache[k];
    console.log('[Auth] Cache de verificação admin limpo');
  };

  // Função para forçar uma nova verificação de status de administrador
  const refreshAdminStatus = async () => {
    if (authState.user?.id) {
      clearAdminCache();
      
      // Recriar a lógica de verificação diretamente aqui
      try {
        console.log('[Auth] Forçando nova verificação admin para userId:', authState.user.id);
        
        const selectCols = 'id, user_id, email, nome, role, tipo, ativo';
        let adminData: any = null;

        // 1) user_id
        const { data: byUserId } = await supabase
          .from('usuarios_admin')
          .select(selectCols)
          .eq('user_id', authState.user.id)
          .eq('ativo', true)
          .maybeSingle();
        adminData = byUserId;

        // 2) id
        if (!adminData) {
          const { data: byId } = await supabase
            .from('usuarios_admin')
            .select(selectCols)
            .eq('id', authState.user.id)
            .eq('ativo', true)
            .maybeSingle();
          adminData = byId;
        }

        // 3) email
        const emailLower = String(authState.user.email || '').toLowerCase();
        if (!adminData && emailLower) {
          const { data: byEmail } = await supabase
            .from('usuarios_admin')
            .select(selectCols)
            .eq('email', emailLower)
            .eq('ativo', true)
            .maybeSingle();
          adminData = byEmail;
        }
        
        const isAdminComputed = !!adminData && ([adminData.role, adminData.tipo]
          .map(v => String(v ?? '').toLowerCase())
          .some(v => ADMIN_LABELS.includes(v))
        );
        const isAdmin = isAdminComputed || authState.user.email === 'semprebellasuporte2025@gmail.com';
        const adminName = computeDisplayName(authState.user, { adminName: adminData?.nome });
        
        setAuthState(prev => ({
          ...prev,
          isAdmin,
          adminName,
        }));
        
        console.log('[Auth] Nova verificação admin concluída:', { isAdmin, adminName });
        return { isAdmin, adminName };
      } catch (error) {
        console.error('[Auth] Erro na verificação forçada admin:', error);
        return { isAdmin: false, adminName: undefined };
      }
    }
    return { isAdmin: false, adminName: undefined };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    clearAdminCache,
    refreshAdminStatus,
  };
};
