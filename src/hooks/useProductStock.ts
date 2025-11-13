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

        // Buscar informações de estoque dos produtos diretamente da tabela products
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('id, estoque')
          .in('id', productIds)
          .eq('ativo', true);

        if (supabaseError) {
          throw new Error(`Erro ao buscar estoque: ${supabaseError.message}`);
        }

        // Mapear os resultados para o formato esperado
        const stockData: ProductStockInfo[] = productIds.map(productId => {
          const productData = data?.find(p => p.id === productId);
          const stock = productData?.estoque || 0;
          return {
            productId,
            stock: stock,
            loading: false
          };
        });

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