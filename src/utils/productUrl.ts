import { slugify, isValidProductSlug } from './productSlug';

export type MinimalProduct = {
  id: string;
  nome?: string | null;
  slug?: string | null;
};

export function buildProductUrl(produto: MinimalProduct): string {
  const current = (produto.slug || '').trim();
  if (current && isValidProductSlug(current)) {
    return `/produto/${current}`;
  }
  const fallback = slugify((produto.nome as string) || '') || produto.id;
  // Inclui UUID como query para compatibilidade de carregamento quando slug não existir no banco
  return `/produto/${fallback}?id=${encodeURIComponent(produto.id)}`;
}