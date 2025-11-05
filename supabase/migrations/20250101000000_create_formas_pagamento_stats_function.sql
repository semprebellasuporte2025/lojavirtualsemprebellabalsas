-- Função para obter estatísticas de formas de pagamento
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

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_formas_pagamento_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_formas_pagamento_stats() TO anon;