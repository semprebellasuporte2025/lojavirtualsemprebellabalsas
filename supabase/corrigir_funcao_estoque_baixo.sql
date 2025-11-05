-- =====================================================
-- CORREÇÃO DA FUNÇÃO produtos_estoque_baixo
-- Corrige o erro de tipo VARCHAR(255) vs TEXT
-- =====================================================

-- Remover a função existente se houver
DROP FUNCTION IF EXISTS produtos_estoque_baixo(INTEGER);

-- Recriar a função com o tipo correto
CREATE OR REPLACE FUNCTION produtos_estoque_baixo(limite_minimo INTEGER DEFAULT 10)
RETURNS TABLE (
  produto_id UUID,
  nome VARCHAR(255),
  estoque_atual INTEGER,
  ultima_venda TIMESTAMPTZ,
  total_vendas_mes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.estoque,
    MAX(ped.created_at) as ultima_venda,
    COUNT(ip.id)::INTEGER as vendas_mes
  FROM public.produtos p
  LEFT JOIN public.itens_pedido ip ON ip.produto_id = p.id::TEXT
  LEFT JOIN public.pedidos ped ON ped.id = ip.pedido_id 
    AND ped.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND ped.status != 'cancelado'
  WHERE p.estoque <= limite_minimo
  GROUP BY p.id, p.nome, p.estoque
  ORDER BY p.estoque ASC, vendas_mes DESC;
END;
$$ LANGUAGE plpgsql;

-- Testar a função corrigida
SELECT 'Função produtos_estoque_baixo corrigida com sucesso!' as resultado;

-- Teste básico da função
SELECT * FROM produtos_estoque_baixo(10) LIMIT 5;