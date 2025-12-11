// Funções utilitárias para gerar slug de produto e garantir unicidade
import { supabase } from '../lib/supabase';

// Slugify com suporte a acentos e caracteres especiais
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // troca não-alfanum por '-'
    .replace(/^-+|-+$/g, '') // trim '-'
    .replace(/-{2,}/g, '-'); // colapsa múltiplos '-'
}

// Alias explícito para normalização de slugs de produtos, conforme política da equipe
export function normalizeProductSlug(text: string): string {
  return slugify(text);
}

// Validação genérica de slug (minúsculas, números e hífens, sem hífen no início/fim)
export function isValidProductSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '');
}

// Garante unicidade do slug na tabela 'produtos', adicionando sufixos incrementais quando necessário
export async function ensureUniqueProductSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let candidate = baseSlug;
  let suffix = 2;

  // Checa direto pela existência
  const exists = async (slug: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, slug')
      .eq('slug', slug);
    if (error) {
      console.warn('Falha ao verificar unicidade de slug de produto:', error);
      return false; // em caso de erro, não bloquear
    }
    if (!data || data.length === 0) return false;
    if (!excludeId) return true;
    return data.some((r) => r.id !== excludeId);
  };

  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix++}`;
  }
  return candidate;
}
