import type { SupabaseClient } from '@supabase/supabase-js';

export interface BannerRecord {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  imagem_url_mobile?: string | null;
  link_destino: string | null;
  texto_botao: string | null;
  ordem_exibicao: number;
  ativo: boolean;
}

/**
 * Busca banners ativos com campos necessários, limitado a 10 e ordenado por ordem_exibicao.
 * Faz fallback se a coluna imagem_url_mobile não existir.
 */
export async function fetchActiveBanners(
  client: SupabaseClient,
  opts?: { includeInactive?: boolean }
): Promise<BannerRecord[]> {
  // Seleciona tentando incluir imagem_url_mobile, faz fallback se coluna não existir
  let query = client
    .from('banners')
    .select(
      'id, titulo, subtitulo, imagem_url, imagem_url_mobile, link_destino, texto_botao, ordem_exibicao, ativo'
    );

  if (!opts?.includeInactive) {
    query = query.eq('ativo', true);
  }

  query = query.order('ordem_exibicao', { ascending: true }).limit(10);

  let { data, error } = await query;

  if (error) {
    // Fallback sem coluna mobile
    if (String(error.message).includes('imagem_url_mobile') || String(error.message).includes('column')) {
      let fallbackQuery = client
        .from('banners')
        .select('id, titulo, subtitulo, imagem_url, link_destino, texto_botao, ordem_exibicao, ativo');

      if (!opts?.includeInactive) {
        fallbackQuery = fallbackQuery.eq('ativo', true);
      }

      const fallback = await fallbackQuery
        .order('ordem_exibicao', { ascending: true })
        .limit(10);
      if (fallback.error) throw fallback.error;
      data = fallback.data as any;
    } else {
      throw error;
    }
  }

  return (data || []) as BannerRecord[];
}

/**
 * Assina mudanças na tabela banners (INSERT, UPDATE, DELETE) e chama o callback.
 * Retorna função de unsubscribe.
 */
export function subscribeToBannerChanges(
  client: SupabaseClient,
  onChange: (payload: any) => void
): () => void {
  try {
    const channel = client
      .channel('banners-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banners' },
        (payload) => {
          try {
            onChange(payload);
          } catch (e) {
            console.warn('Erro no callback de mudanças de banners:', e);
          }
        }
      );

    // Tenta assinar com timeout para evitar bloqueio por falha de WebSocket
    const subscribePromise = channel.subscribe();
    
    // Timeout para evitar que falhas de WebSocket bloqueiem a aplicação
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na conexão WebSocket')), 5000);
    });

    Promise.race([subscribePromise, timeoutPromise])
      .then(() => {
        console.log('Assinatura realtime de banners bem-sucedida');
      })
      .catch((error) => {
        // Log mais detalhado para erros de WebSocket
        if (error.message.includes('WebSocket') || error.message.includes('connection')) {
          console.warn('Falha na conexão WebSocket para banners em tempo real. Esta funcionalidade requer WebSockets habilitados no navegador.');
        } else {
          console.warn('Falha na assinatura realtime de banners:', error.message);
        }
        // Remove o canal em caso de falha
        try {
          client.removeChannel(channel);
        } catch (e) {
          // noop
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        // noop
      }
    };
  } catch (error) {
    console.warn('Erro ao criar canal realtime de banners:', error);
    // Retorna função vazia para unsubscribe
    return () => {};
  }
}