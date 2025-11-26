import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface VariantStockResult {
  map: Map<string, number>;
  loading: boolean;
  error?: string;
}

// Retorna um mapa de estoque por variante, chaveado por `${produto_id}|${tamanho}|${cor.toLowerCase()}`
export function useVariantStockMap(productIds: string[]): VariantStockResult {
  const [map, setMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        setLoading(true);
        setError(undefined);

        if (!productIds || productIds.length === 0) {
          setMap(new Map());
          setLoading(false);
          return;
        }

        const { data, error: supabaseError } = await supabase
          .from('variantes_produto')
          .select('produto_id, tamanho, cor, estoque, ativo')
          .in('produto_id', productIds)
          .eq('ativo', true);

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        const m = new Map<string, number>();
        (data || []).forEach((v: any) => {
          const pid = String(v?.produto_id || '');
          const size = String(v?.tamanho || '');
          const color = String(v?.cor || '').toLowerCase();
          const qty = Number(v?.estoque ?? 0);
          if (!pid || !size || !color) return;
          m.set(`${pid}|${size}|${color}`, qty);
        });

        setMap(m);
      } catch (err) {
        console.error('Erro ao buscar estoque por variante:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar estoque por variante');
        setMap(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [productIds]);

  return { map, loading, error };
}