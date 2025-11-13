import { describe, it, expect, vi } from 'vitest';
import { isSlugLike, buildCategoryUrl, normalizeCategoryParam, resolveCategoryRoute } from '../categoryRoutes';

// Mock do supabase para o caso de UUID
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: () => Promise.resolve({
              data: [{ slug: 'macacao', nome: 'Macacão' }],
            }),
          }),
        }),
      }),
    },
  };
});

describe('category routes utils', () => {
  it('identifies slug-like strings', () => {
    expect(isSlugLike('macacao')).toBe(true);
    expect(isSlugLike('roupas-infantis')).toBe(true);
    expect(isSlugLike('Macacão')).toBe(false);
    expect(isSlugLike('maça')).toBe(false);
  });

  it('builds category URL correctly', () => {
    expect(buildCategoryUrl('macacao')).toBe('/categoria/macacao');
  });

  it('normalizes non-slug names to slug', () => {
    expect(normalizeCategoryParam('Macacão')).toBe('macacao');
  });

  it('resolves UUID to slug-based route using DB', async () => {
    const url = await resolveCategoryRoute('00000000-0000-4000-8000-000000000000');
    expect(url).toBe('/categoria/macacao');
  });
});