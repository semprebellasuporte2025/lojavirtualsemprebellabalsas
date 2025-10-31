
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
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

  useEffect(() => {
    let mounted = true;
    let isCheckingAdmin = false;
    let safetyTimer: number | null = null;
    let activityTimer: number | null = null;

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

    const checkAdminStatus = async (userId: string): Promise<{isAdmin: boolean, adminName?: string}> => {
      if (isCheckingAdmin) {
        console.log('[Auth] Verificação admin já em andamento, retornando false');
        return {isAdmin: false};
      }
      isCheckingAdmin = true;
      
      try {
        console.log('[Auth] Verificando status admin para userId:', userId);
        
        // Timeout de 5 segundos para verificação admin
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na verificação admin')), 5000);
        });
        
        const queryPromise = supabase
          .from('usuarios_admin')
          .select('*')
          .eq('user_id', userId)
          .eq('ativo', true)
          .maybeSingle();
        
        const { data: adminData } = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        const result = {
          isAdmin: !!adminData,
          adminName: adminData?.nome
        };
        
        console.log('[Auth] Resultado verificação admin:', result);
        return result;
      } catch (error) {
        console.error('[Auth] Erro na verificação admin:', error);
        return {isAdmin: false};
      } finally {
        isCheckingAdmin = false;
      }
    };

    // Timer de segurança para garantir que loading termine
    safetyTimer = window.setTimeout(() => {
      if (mounted) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 3000);

    // Verificar sessão atual
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          const adminStatus = await checkAdminStatus(session.user.id);
          
          if (safetyTimer) clearTimeout(safetyTimer);
          setAuthState({
            user: session.user,
            session,
            loading: false,
            isAdmin: adminStatus.isAdmin,
            adminName: adminStatus.adminName,
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
        console.log('[Auth] Estado mudou:', event, session?.user?.email);
        
        if (!mounted) return;

        // Evitar logout desnecessário em eventos de refresh de token
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('[Auth] Token refreshed, mantendo usuário logado');
          return;
        }

        if (session?.user) {
          console.log('[Auth] Processando login para:', session.user.email);
          
          // Fallback especial para email admin específico
          if (session.user.email === 'semprebellasuporte2025@gmail.com') {
            console.log('[Auth] Email admin específico detectado, definindo como admin');
            setAuthState({
              user: session.user,
              session,
              loading: false,
              isAdmin: true,
              adminName: 'Admin Principal',
            });
            console.log('[Auth] ✅ Estado atualizado com sucesso (admin específico)');
            return;
          }
          
          try {
            const adminStatus = await checkAdminStatus(session.user.id);
            console.log('[Auth] Status admin verificado:', adminStatus);
            
            setAuthState({
              user: session.user,
              session,
              loading: false,
              isAdmin: adminStatus.isAdmin,
              adminName: adminStatus.adminName,
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

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
};
