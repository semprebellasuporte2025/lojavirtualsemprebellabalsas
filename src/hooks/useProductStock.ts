import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProductStockInfo {
  productId: string;
  stock: number;
  loading: boolean;
  error?: string;
}

export const useProductStock = (productIds: string[]) => {
  const [stockInfo, setStockInfo] = useState<ProductStockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchProductStock = async () => {
      if (!productIds || productIds.length === 0) {
        setStockInfo([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(undefined);

        // Buscar estoque real somando as variantes ativas por produto
        const { data: variantes, error: supabaseError } = await supabase
          .from('variantes_produto')
          .select('produto_id, estoque, ativo')
          .in('produto_id', productIds)
          .eq('ativo', true);

        if (supabaseError) {
          throw new Error(`Erro ao buscar estoque: ${supabaseError.message}`);
        }

        // Mapear os resultados para o formato esperado
        // Agregar estoque por produto_id
        const aggregatedMap = new Map<string, number>();
        (variantes || []).forEach(v => {
          const pid = v?.produto_id;
          const qtd = Number(v?.estoque ?? 0);
          if (!pid) return;
          aggregatedMap.set(pid, (aggregatedMap.get(pid) || 0) + qtd);
        });

        const stockData: ProductStockInfo[] = productIds.map(productId => ({
          productId,
          stock: aggregatedMap.get(productId) || 0,
          loading: false
        }));

        setStockInfo(stockData);
      } catch (err) {
        console.error('Erro ao buscar informações de estoque:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        
        // Em caso de erro, definir estoque padrão como 0
        const fallbackData: ProductStockInfo[] = productIds.map(productId => ({
          productId,
          stock: 0,
          loading: false
        }));
        setStockInfo(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchProductStock();
  }, [productIds]);

  return { stockInfo, loading, error };
};

export const useSingleProductStock = (productId: string) => {
  const { stockInfo, loading, error } = useProductStock([productId]);
  return {
    stock: stockInfo[0]?.stock || 0,
    loading,
    error
  };
};