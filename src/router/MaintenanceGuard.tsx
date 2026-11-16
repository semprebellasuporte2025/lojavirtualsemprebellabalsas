import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MaintenancePage from '../pages/maintenance/MaintenancePage';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface MaintenanceGuardProps {
  children?: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const isUserAdmin = Boolean(
    isAdmin ||
    (user as any)?.role === 'admin' ||
    (user as any)?.app_metadata?.role === 'admin'
  );

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    // Inicialização rápida via cache local caso exista
    return typeof window !== 'undefined'
      ? localStorage.getItem('site_maintenance_mode') === 'true'
      : false;
  });
  const [maintenanceLoading, setMaintenanceLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function checkMaintenanceStatus() {
      try {
        setMaintenanceLoading(true);

        // Consulta direto no Supabase para sincronizar guia anônima e outros navegadores
        const { data, error } = await supabase
          .from('configuracoes_sistema')
          .select('valor')
          .eq('chave', 'modo_manutencao')
          .maybeSingle();

        if (isMounted) {
          if (!error && data) {
            const active = data.valor === 'true';
            setIsMaintenanceMode(active);
            localStorage.setItem('site_maintenance_mode', String(active));
          } else {
            // Se a tabela ainda não estiver criada, usa o cache local
            const saved = localStorage.getItem('site_maintenance_mode') === 'true';
            setIsMaintenanceMode(saved);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status de manutenção:', err);
      } finally {
        if (isMounted) setMaintenanceLoading(false);
      }
    }

    checkMaintenanceStatus();

    // Sincronização em tempo real caso mude em outra aba
    const handleLocalChange = () => {
      const saved = localStorage.getItem('site_maintenance_mode') === 'true';
      setIsMaintenanceMode(saved);
    };

    window.addEventListener('maintenance_mode_changed', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);

    return () => {
      isMounted = false;
      window.removeEventListener('maintenance_mode_changed', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    };
  }, []);

  // Exceção de segurança para rota de login
  const isAuthRoute = location.pathname.startsWith('/auth/login');

  if (authLoading || maintenanceLoading) {
    return null;
  }

  // Regra de bloqueio estrita
  if (isMaintenanceMode && !isUserAdmin && !isAuthRoute) {
    return <MaintenancePage />;
  }

  return children ? <>{children}</> : <Outlet />;
}
