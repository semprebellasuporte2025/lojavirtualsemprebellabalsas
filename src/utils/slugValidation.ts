// Import dinâmico do supabase dentro da função para evitar erro em ambiente Node

// Regex: letras minúsculas, números e hífens; sem hífen no início/fim; sem espaços
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return slugRegex.test(slug);
}

export function getSlugValidationError(slug: string): string | null {
  if (!slug) return 'Slug é obrigatório';
  if (!isValidSlug(slug)) {
    return 'Use apenas letras minúsculas, números e hífens, sem hífens no início/fim.';
  }
  return null;
}

export async function isUniqueSlug(slug: string, excludeId?: string): Promise<boolean> {
  const { supabase } = await import('../lib/supabase');
  // Consulta rápida apenas para contagem
  const { count, error } = await supabase
    .from('categorias')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);

  if (error) {
    console.warn('Falha ao verificar unicidade do slug:', error);
    // Em caso de erro de rede, não bloquear usuário
    return true;
  }

  if (!count || count === 0) return true;
  if (!excludeId) return false;

  // Se excluir o mesmo id, verificar diretamente
  const { data: rows } = await supabase
    .from('categorias')
    .select('id')
    .eq('slug', slug);
  const others = (rows || []).filter((r) => r.id !== excludeId);
  return others.length === 0;
}