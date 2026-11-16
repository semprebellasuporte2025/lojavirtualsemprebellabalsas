import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MaintenancePage from '../pages/maintenance/MaintenancePage';
import { useAuth } from '../hooks/useAuth';

interface MaintenanceGuardProps {
  children?: React.ReactNode;
}

/**
 * MaintenanceGuard:
 * Componente wrapper para proteger o roteamento da aplicação.
 * 
 * REGRA ESTRITA:
 * Se `isMaintenanceMode === true`, APENAS administradores (user.role === 'admin' / isAdmin === true)
 * têm permissão de navegar. Qualquer outro usuário ou visitante é bloqueado e visualiza a `MaintenancePage`.
 */
export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const location = useLocation();

  // ============================================================================
  // 🔌 1. ONDE PLUGAR OS DADOS DO USUÁRIO ATUAL (AUTH / CONTEXT / SUPABASE)
  // ============================================================================
  // Aqui consumimos o hook de autenticação da aplicação (useAuth):
  const { user, isAdmin, loading: authLoading } = useAuth();

  /*
    Alternativamente, se você usar Context API próprio, Zustand ou Supabase puro:
    const currentUser = useUserStore((state) => state.user);
    const isUserAdmin = currentUser?.role === 'admin';
  */
  const isUserAdmin = Boolean(isAdmin || (user as any)?.role === 'admin' || (user as any)?.app_metadata?.role === 'admin');

  // Estado do Modo de Manutenção
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState<boolean>(true);

  // ============================================================================
  // 🔌 2. ONDE PLUGAR A CONSULTA AO BANCO DE DADOS (SUPABASE / API / ZUSTAND)
  // ============================================================================
  useEffect(() => {
    async function checkMaintenanceStatus() {
      try {
        setMaintenanceLoading(true);

        /*
          EXEMPLO 1 (Supabase Realtime ou consulta de tabela de configurações):
          const { data, error } = await supabase
            .from('configuracoes_sistema')
            .select('valor')
            .eq('chave', 'modo_manutencao')
            .single();

          if (data) {
            setIsMaintenanceMode(data.valor === 'true');
          }

          EXEMPLO 2 (Zustand ou Context Global):
          const globalMaintenance = useConfigStore.getState().isMaintenanceMode;
          setIsMaintenanceMode(globalMaintenance);
        */

        // Fallback / Padrão local com sincronização automática entre abas:
        const checkLocal = () => {
          const saved = localStorage.getItem('site_maintenance_mode') === 'true';
          setIsMaintenanceMode(saved);
        };

        checkLocal();

        // Ouve atualizações em tempo real disparadas pelo painel de configurações
        window.addEventListener('maintenance_mode_changed', checkLocal);
        window.addEventListener('storage', checkLocal);

        return () => {
          window.removeEventListener('maintenance_mode_changed', checkLocal);
          window.removeEventListener('storage', checkLocal);
        };
      } catch (err) {
        console.error('Erro ao verificar status de manutenção:', err);
      } finally {
        setMaintenanceLoading(false);
      }
    }

    checkMaintenanceStatus();
  }, []);

  // Exceção de segurança essencial: permite acessar a tela de login (/auth/login)
  // para que administradores deslogados consigam se autenticar mesmo com a manutenção ligada!
  const isAuthRoute = location.pathname.startsWith('/auth/login');

  // Enquanto valida a autenticação inicial ou status de manutenção, não bloqueia prematuramente
  if (authLoading || maintenanceLoading) {
    return null; // ou um spinner discreto
  }

  // ============================================================================
  // 🔒 3. APLICAÇÃO DA REGRA DE BLOQUEIO ESTRITA
  // ============================================================================
  if (isMaintenanceMode && !isUserAdmin && !isAuthRoute) {
    // Bloqueia qualquer visitante ou cliente comum: renderiza APENAS a tela de manutenção
    return <MaintenancePage />;
  }

  // Se o modo de manutenção estiver desligado OU se o usuário for Administrador:
  return children ? <>{children}</> : <Outlet />;
}
