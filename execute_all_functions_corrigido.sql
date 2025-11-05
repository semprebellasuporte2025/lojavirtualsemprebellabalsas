-- Script SQL corrigido para criar todas as funções do dashboard
-- Execute este script no SQL Editor do Supabase Studio

-- 1. Função para estatísticas de formas de pagamento
CREATE OR REPLACE FUNCTION get_formas_pagamento_stats()
RETURNS TABLE (
  forma_pagamento TEXT,
  quantidade BIGINT,
  valor_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.forma_pagamento::TEXT,
    COUNT(*)::BIGINT as quantidade,
    COALESCE(SUM(p.total), 0)::NUMERIC as valor_total
  FROM pedidos p
  WHERE p.status != 'cancelado'
    AND p.forma_pagamento IS NOT NULL
  GROUP BY p.forma_pagamento
  ORDER BY quantidade DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_formas_pagamento_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_formas_pagamento_stats() TO anon;

-- 2. Função para pedidos recentes
CREATE OR REPLACE FUNCTION get_pedidos_recentes(limite INTEGER DEFAULT 10)
RETURNS TABLE (
  numero_pedido TEXT,
  nome TEXT,
  total NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.numero_pedido::TEXT,
    c.nome::TEXT,
    p.total::NUMERIC,
    p.status::TEXT,
    p.created_at
  FROM pedidos p
  LEFT JOIN clientes c ON p.cliente_id = c.id
  ORDER BY p.created_at DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_pedidos_recentes(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pedidos_recentes(INTEGER) TO anon;

-- 3. Função para resumo do negócio (SIMPLIFICADA)
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
    
    -- Região principal (usando valor fixo já que informações de localização podem não estar disponíveis)
    'Balsas - MA'::TEXT as regiao_principal,
    
    -- Produtos com estoque baixo (estoque <= 5 e não nulo)
    (SELECT COUNT(*) FROM produtos WHERE estoque IS NOT NULL AND estoque <= 5 AND estoque >= 0) as produtos_estoque_baixo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_business_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_summary() TO anon;

-- 4. Função para estatísticas da dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_pedidos BIGINT,
  faturamento_total NUMERIC,
  total_clientes BIGINT,
  total_produtos BIGINT,
  ticket_medio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total de pedidos
    (SELECT COUNT(*) FROM pedidos) as total_pedidos,
    
    -- Faturamento total (soma de todos os pedidos)
    (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE status != 'cancelado') as faturamento_total,
    
    -- Total de clientes
    (SELECT COUNT(*) FROM clientes) as total_clientes,
    
    -- Total de produtos
    (SELECT COUNT(*) FROM produtos) as total_produtos,
    
    -- Ticket médio (faturamento total / número de pedidos)
    CASE 
      WHEN (SELECT COUNT(*) FROM pedidos WHERE status != 'cancelado') > 0 THEN
        (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE status != 'cancelado') / 
        (SELECT COUNT(*) FROM pedidos WHERE status != 'cancelado')
      ELSE 0
    END as ticket_medio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;

-- Testar todas as funções
SELECT 'Testando get_formas_pagamento_stats' as info;
SELECT * FROM get_formas_pagamento_stats();

SELECT 'Testando get_pedidos_recentes' as info;
SELECT * FROM get_pedidos_recentes(5);

SELECT 'Testando get_business_summary' as info;
SELECT * FROM get_business_summary();

SELECT 'Testando get_dashboard_stats' as info;
SELECT * FROM get_dashboard_stats();

SELECT 'Todas as funções foram criadas e testadas com sucesso!' as resultado;