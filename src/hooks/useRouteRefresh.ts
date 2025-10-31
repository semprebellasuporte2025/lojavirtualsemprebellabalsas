import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook personalizado para forçar recarregamento de componentes quando a rota muda
 * Útil para garantir que dados sejam recarregados quando o usuário navega de volta para uma página
 */
export function useRouteRefresh() {
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Incrementa a chave de refresh sempre que a localização muda
    setRefreshKey(prev => prev + 1);
  }, [location.pathname, location.search]);

  return refreshKey;
}

/**
 * Hook para detectar quando o usuário navega para uma rota específica
 * Útil para executar ações específicas quando uma página é acessada
 */
export function useRouteEntry(targetPath: string, callback: () => void) {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === targetPath || 
        (targetPath === '/home' && (location.pathname === '/' || location.pathname === '/home'))) {
      callback();
    }
  }, [location.pathname, targetPath, callback]);
}