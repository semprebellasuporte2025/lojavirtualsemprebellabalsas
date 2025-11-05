-- Função simplificada para testar produtos ativos
CREATE OR REPLACE FUNCTION test_produtos_ativos()
RETURNS TABLE (
  total_produtos BIGINT,
  produtos_com_estoque BIGINT,
  produtos_sem_estoque BIGINT,
  produtos_estoque_null BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM produtos) as total_produtos,
    (SELECT COUNT(*) FROM produtos WHERE estoque IS NOT NULL AND estoque > 0) as produtos_com_estoque,
    (SELECT COUNT(*) FROM produtos WHERE estoque IS NOT NULL AND estoque = 0) as produtos_sem_estoque,
    (SELECT COUNT(*) FROM produtos WHERE estoque IS NULL) as produtos_estoque_null;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION test_produtos_ativos() TO authenticated;
GRANT EXECUTE ON FUNCTION test_produtos_ativos() TO anon;

-- Testar a função
SELECT * FROM test_produtos_ativos();