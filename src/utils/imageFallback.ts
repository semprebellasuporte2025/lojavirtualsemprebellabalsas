/**
 * Utilitários para lidar com fallback de imagens quando há problemas de conexão
 */

/**
 * Verifica se uma URL é do Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith('.supabase.co') && u.pathname.includes('/storage/');
  } catch {
    return url.includes('supabase.co') && url.includes('/storage/');
  }
}

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/**
 * Handler para eventos de erro/abort de imagem com fallback inteligente.
 * - Se estiver offline, usa placeholder local.
 * - Se for uma URL do Supabase com erro, usa um fallback do Unsplash.
 * - Caso contrário, retorna null para que o chamador aplique fallback padrão.
 */
export function handleImageError(
  originalSrc: string,
  logError?: (message: string, details?: any) => void
): string | null {
  // Offline: usar placeholder local
  if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
    logError?.('Offline detectado, usando placeholder local', { originalSrc });
    return '/placeholder-large.svg';
  }

  // Erro ao carregar imagem remota (Supabase ou qualquer terceiro): usar placeholder local
  if (isSupabaseStorageUrl(originalSrc) || isRemoteUrl(originalSrc)) {
    logError?.('Erro ao carregar imagem remota, usando placeholder local', {
      originalSrc,
      placeholder: '/placeholder-large.svg',
    });
    return '/placeholder-large.svg';
  }

  return null;
}

// Sem pré-carregamento externo para evitar bloqueios ORB; usamos placeholder local