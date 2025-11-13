import { supabase } from '../lib/supabase';
import { generateSlug } from './formatters';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSlugLike(s: string): boolean {
  return slugRegex.test(s);
}

export function isUuid(s: string): boolean {
  return uuidRegex.test(s);
}

export function buildCategoryUrl(slug: string): string {
  return `/categoria/${slug}`;
}

export function normalizeCategoryParam(param: string): string {
  if (!param) return '';
  return isSlugLike(param) ? param : generateSlug(param);
}

export async function resolveCategoryRoute(param: string): Promise<string | null> {
  if (!param) return null;
  // Primeiro tratar UUID para evitar cair como slug válido
  if (isUuid(param)) {
    const { data } = await supabase
      .from('categorias')
      .select('slug, nome')
      .eq('id', param)
      .limit(1);
    const row = Array.isArray(data) ? data[0] : null;
    const slug = row?.slug || (row?.nome ? generateSlug(row.nome) : null);
    return slug ? buildCategoryUrl(slug) : null;
  }

  if (isSlugLike(param)) return buildCategoryUrl(param);

  const slug = generateSlug(param);
  return buildCategoryUrl(slug);
}