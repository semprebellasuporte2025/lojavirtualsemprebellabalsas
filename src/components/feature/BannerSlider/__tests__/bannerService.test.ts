import { describe, it, expect } from 'vitest';
import { fetchActiveBanners } from '../bannerService';

function makeClientWithSequence(results: Array<{ data?: any; error?: any }>) {
  let call = 0;
  return {
    from() {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        order() { return builder; },
        limit() {
          const res = results[Math.min(call, results.length - 1)];
          call++;
          return Promise.resolve(res);
        }
      };
      return builder;
    }
  } as any;
}

describe('fetchActiveBanners', () => {
  it('returns banners on normal select', async () => {
    const data = [
      { id: '1', titulo: 'A', imagem_url: 'x', ordem_exibicao: 1, ativo: true },
      { id: '2', titulo: 'B', imagem_url: 'y', ordem_exibicao: 2, ativo: true }
    ];
    const client = makeClientWithSequence([{ data, error: null }]);
    const out = await fetchActiveBanners(client);
    expect(out.length).toBe(2);
    expect(out[0].id).toBe('1');
  });

  it('falls back when imagem_url_mobile column is missing', async () => {
    const data = [{ id: '3', titulo: 'C', imagem_url: 'z', ordem_exibicao: 1, ativo: true }];
    const client = makeClientWithSequence([
      { data: null, error: { message: 'column imagem_url_mobile does not exist' } },
      { data, error: null }
    ]);
    const out = await fetchActiveBanners(client);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe('3');
  });
});