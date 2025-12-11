import { normalizeProductSlug, isValidProductSlug } from './productSlug';

export type MinimalProduct = {
  id: string;
  nome?: string | null;
  slug?: string | null;
};

export function buildProductUrl(produto: MinimalProduct): string {
  const current = (produto.slug || '').trim();
  const base = current && isValidProductSlug(current)
    ? current
    : (normalizeProductSlug((produto.nome as string) || '') || produto.id);
  // Gera URL somente com o slug do produto (sem UUID na query)
  return `/produto/${base}`;
}
