-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- Agora criar a nova versão da função com o tipo correto
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

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;