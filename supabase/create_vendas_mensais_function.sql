-- Função para obter vendas mensais dos últimos 12 meses
CREATE OR REPLACE FUNCTION get_vendas_mensais()
RETURNS TABLE (
  mes DATE,
  vendas_mes BIGINT,
  faturamento_mes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', p.created_at)::DATE as mes,
    COUNT(*)::BIGINT as vendas_mes,
    COALESCE(SUM(p.total), 0)::NUMERIC as faturamento_mes
  FROM pedidos p
  WHERE p.created_at >= CURRENT_DATE - INTERVAL '12 months'
    AND p.status != 'cancelado'
  GROUP BY DATE_TRUNC('month', p.created_at)
  ORDER BY mes DESC
  LIMIT 12;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_vendas_mensais() TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendas_mensais() TO anon;