export type PostLoginParams = {
  isAdmin: boolean;
  isAtendente: boolean;
  isUsuario: boolean;
  fromPath?: string | null;
  cartHasItems: boolean;
  currentPath?: string;
};

export const DEFAULT_CUSTOMER_REDIRECT = '/minha-conta';
export const ADMIN_REDIRECT = '/paineladmin';

// Normaliza o "from" para um path simples (remove domínio e query)
export function normalizeFrom(from?: string | null): string | undefined {
  if (!from) return undefined;
  try {
    // Aceita formatos como "/checkout", "https://site/checkout?x=1", etc.
    if (from.startsWith('http://') || from.startsWith('https://')) {
      const url = new URL(from);
      return url.pathname || undefined;
    }
    // Remove query string se vier apenas o path
    return from.split('?')[0] || undefined;
  } catch {
    return undefined;
  }
}

// Decide o destino pós-login considerando perfil, intenção e carrinho
export function determinePostLoginRedirect(params: PostLoginParams): string | null {
  const { isAdmin, isAtendente, isUsuario, fromPath, cartHasItems, currentPath } = params;

  // Admin/Atendente/Usuário (staff) sempre vão para o painel
  if (isAdmin || isAtendente || isUsuario) {
    return currentPath === ADMIN_REDIRECT ? null : ADMIN_REDIRECT;
  }

  const from = normalizeFrom(fromPath);

  // Se veio do checkout e há itens, volta ao checkout
  if (from === '/checkout' && cartHasItems) {
    return currentPath === '/checkout' ? null : '/checkout';
  }

  // Se veio do carrinho, mantém contexto do carrinho
  if (from === '/carrinho') {
    return currentPath === '/carrinho' ? null : '/carrinho';
  }

  // Padrão para cliente
  return currentPath === DEFAULT_CUSTOMER_REDIRECT ? null : DEFAULT_CUSTOMER_REDIRECT;
}

// Evita loops de redirecionamento redundantes
export function shouldRedirect(currentPath: string | undefined, targetPath: string | null): boolean {
  if (!targetPath) return false;
  return (currentPath || '') !== targetPath;
}