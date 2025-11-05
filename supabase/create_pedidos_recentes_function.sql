-- Função para obter pedidos recentes
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

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_pedidos_recentes(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pedidos_recentes(INTEGER) TO anon;