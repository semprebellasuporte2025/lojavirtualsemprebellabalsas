-- Corrigir função get_business_summary para usar tabela pedidos corretamente

-- Primeiro, dropar a função existente se houver
DROP FUNCTION IF EXISTS get_business_summary();

CREATE OR REPLACE FUNCTION get_business_summary()
RETURNS TABLE (
    produtos_ativos BIGINT,
    taxa_entrega NUMERIC,
    regiao_principal TEXT,
    produtos_estoque_baixo BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Produtos ativos (com estoque total > 0 considerando todas as variações)
    (SELECT COUNT(DISTINCT p.id)
     FROM produtos p
     WHERE p.ativo = true
     AND EXISTS (
         SELECT 1 
         FROM variantes_produto vp 
         WHERE vp.produto_id = p.id 
         AND vp.ativo = true
         AND vp.estoque > 0
     )) as produtos_ativos,
    
    -- Taxa de entrega baseada em pedidos (pedidos entregues / pedidos não cancelados * 100)
    CASE 
      WHEN (SELECT COUNT(*) FROM pedidos WHERE status NOT IN ('cancelado')) > 0 THEN
        ROUND(
          (SELECT COUNT(*)::NUMERIC FROM pedidos WHERE status = 'entregue') * 100.0 / 
          (SELECT COUNT(*) FROM pedidos WHERE status NOT IN ('cancelado')), 1
        )
      ELSE 0
    END as taxa_entrega,
    
    -- Região principal (cidade mais frequente nos pedidos - usando clientes.cidade)
    (SELECT 
      COALESCE(
        (SELECT c.cidade 
         FROM pedidos p 
         JOIN clientes c ON c.id = p.cliente_id 
         WHERE c.cidade IS NOT NULL 
           AND c.cidade != ''
         GROUP BY c.cidade 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        'Balsas - MA'
      )
    ) as regiao_principal,
    
    -- Produtos com estoque baixo (estoque total <= 5 considerando todas as variações)
    (SELECT COUNT(DISTINCT p.id)
     FROM produtos p
     WHERE p.ativo = true
     AND (
         SELECT COALESCE(SUM(vp.estoque), 0)
         FROM variantes_produto vp 
         WHERE vp.produto_id = p.id 
         AND vp.ativo = true
     ) <= 5
     AND (
         SELECT COALESCE(SUM(vp.estoque), 0)
         FROM variantes_produto vp 
         WHERE vp.produto_id = p.id 
         AND vp.ativo = true
     ) > 0) as produtos_estoque_baixo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_business_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_summary() TO anon;

-- Testar a função
SELECT 
  'Teste da função corrigida' as info,
  produtos_ativos,
  taxa_entrega_percentual,
  regiao_principal,
  produtos_estoque_baixo
FROM get_business_summary();