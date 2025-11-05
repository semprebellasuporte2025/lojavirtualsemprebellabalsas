-- Corrigir função get_business_summary
-- Remove a função existente e recria com verificações mais robustas

-- 1. Remover função existente
DROP FUNCTION IF EXISTS get_business_summary();

-- 2. Recriar função com verificações mais robustas
CREATE OR REPLACE FUNCTION get_business_summary()
RETURNS TABLE (
  produtos_ativos BIGINT,
  taxa_entrega_percentual NUMERIC,
  regiao_principal TEXT,
  produtos_estoque_baixo BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Produtos ativos (com estoque > 0 e não nulo)
    (SELECT COUNT(*) FROM produtos WHERE estoque IS NOT NULL AND estoque > 0) as produtos_ativos,
    
    -- Taxa de entrega (pedidos entregues / total de pedidos * 100)
    CASE 
      WHEN (SELECT COUNT(*) FROM pedidos WHERE status != 'cancelado') > 0 THEN
        ROUND(
          (SELECT COUNT(*)::NUMERIC FROM pedidos WHERE status = 'entregue') * 100.0 / 
          (SELECT COUNT(*) FROM pedidos WHERE status != 'cancelado'), 1
        )
      ELSE 0
    END as taxa_entrega_percentual,
    
    -- Região principal (cidade mais frequente nos endereços de entrega)
    (SELECT 
      COALESCE(
        (SELECT cidade 
         FROM pedidos p 
         JOIN clientes c ON c.id = p.cliente_id 
         WHERE p.status != 'cancelado' AND c.cidade IS NOT NULL AND c.cidade != ''
         GROUP BY c.cidade 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        'Balsas - MA'
      )
    ) as regiao_principal,
    
    -- Produtos com estoque baixo (estoque <= 5 e não nulo)
    (SELECT COUNT(*) FROM produtos WHERE estoque IS NOT NULL AND estoque <= 5 AND estoque >= 0) as produtos_estoque_baixo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Conceder permissões
GRANT EXECUTE ON FUNCTION get_business_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_summary() TO anon;

-- 4. Testar a função
SELECT 
  'Teste da função corrigida' as info,
  produtos_ativos,
  taxa_entrega_percentual,
  regiao_principal,
  produtos_estoque_baixo
FROM get_business_summary();