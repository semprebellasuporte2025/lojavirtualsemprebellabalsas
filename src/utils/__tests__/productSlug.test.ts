import { describe, it, expect, vi } from 'vitest';
import { normalizeProductSlug, ensureUniqueProductSlug, isValidProductSlug } from '../productSlug';
import { buildProductUrl } from '../productUrl';

// Mock do supabase para testar ensureUniqueProductSlug
vi.mock('../../lib/supabase', () => {
  // estrutura mínima para responder às consultas usadas em ensureUniqueProductSlug
  const rows: any[] = [
    { id: 'id-1', slug: 'vestido-midi-alfaiataria-cinto-lenco' },
    { id: 'id-2', slug: 'vestido-midi-alfaiataria-cinto-lenco' },
  ];
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: (field: string, value: string) => {
            if (field === 'slug') {
              const data = rows.filter((r) => r.slug === value);
              return Promise.resolve({ data, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
    },
  };
});

describe('normalização de slugs de produto', () => {
  it('remove acentos, converte para minúsculas e usa hífens', () => {
    const s = normalizeProductSlug('Vestido Midi Alfaiataria Cinto Lenço');
    expect(s).toBe('vestido-midi-alfaiataria-cinto-lenco');
  });

  it('substitui "ç" por "c" e remove caracteres especiais', () => {
    const s = normalizeProductSlug('Calça & Camiseta – Edição Especial!');
    expect(s).toBe('calca-camiseta-edicao-especial');
  });

  it('valida formato final do slug', () => {
    expect(isValidProductSlug('vestido-midi-alfaiataria-cinto-lenco')).toBe(true);
    expect(isValidProductSlug('Invalido Com Espaço')).toBe(false);
    expect(isValidProductSlug('fim-')).toBe(false);
    expect(isValidProductSlug('-inicio')).toBe(false);
  });
});

describe('URLs de produto', () => {
  it('gera URL apenas com slug', () => {
    const url = buildProductUrl({ id: 'uuid-qualquer', nome: 'Vestido Midi Alfaiataria Cinto Lenço', slug: null });
    expect(url).toBe('/produto/vestido-midi-alfaiataria-cinto-lenco');
  });

  it('mantém slug existente válido', () => {
    const url = buildProductUrl({ id: 'uuid-qualquer', nome: 'Qualquer Nome', slug: 'macacao-tomara-que-caia' });
    expect(url).toBe('/produto/macacao-tomara-que-caia');
  });
});

describe('correção de slugs existentes com unicidade', () => {
  it('aplica sufixos incrementais quando há duplicidade', async () => {
    const base = normalizeProductSlug('Vestido Midi Alfaiataria Cinto Lenço');
    const unique = await ensureUniqueProductSlug(base, 'id-1');
    // Como já existem dois registros com o mesmo slug, para id-1 deve sugerir o próximo disponível
    expect(unique).toMatch(/^vestido-midi-alfaiataria-cinto-lenco-\d+$/);
  });
});

