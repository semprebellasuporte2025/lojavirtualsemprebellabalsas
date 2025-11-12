import { describe, it, expect, vi } from 'vitest';
import { fetchActiveBanners, subscribeToBannerChanges } from '../bannerService';

// Cliente Supabase mínimo simulado
function makeClientWithData(list: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: list, error: null }),
          }),
        }),
      }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({ subscribe: vi.fn().mockReturnValue({}) }),
    }),
    removeChannel: vi.fn(),
  } as any;
}

describe('fetchActiveBanners (auth independente)', () => {
  it('retorna banners ativos mesmo sem sessão (cliente público)', async () => {
    const dummy = [{ id: '1', titulo: 'T1', subtitulo: null, imagem_url: 'x', link_destino: null, texto_botao: null, ordem_exibicao: 1, ativo: true }];
    const client = makeClientWithData(dummy);
    const data = await fetchActiveBanners(client);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe('1');
  });

  it('faz fallback quando coluna mobile não existe', async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'column imagem_url_mobile does not exist' } }),
      }),
    } as any;
    const data = await fetchActiveBanners(client);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('subscribeToBannerChanges', () => {
  it('registra canal e retorna unsubscribe', () => {
    const client = makeClientWithData([]);
    const cb = vi.fn();
    const unsub = subscribeToBannerChanges(client, cb);
    expect(typeof unsub).toBe('function');
  });
});