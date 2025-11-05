-- Debug: Verificar produtos ativos
-- Execute este SQL no Supabase para diagnosticar o problema

-- 1. Verificar total de produtos
SELECT 'Total de produtos' as tipo, COUNT(*) as quantidade FROM produtos;

-- 2. Verificar produtos com estoque > 0
SELECT 'Produtos com estoque > 0' as tipo, COUNT(*) as quantidade FROM produtos WHERE estoque > 0;

-- 3. Verificar produtos com estoque = 0
SELECT 'Produtos com estoque = 0' as tipo, COUNT(*) as quantidade FROM produtos WHERE estoque = 0;

-- 4. Verificar produtos com estoque NULL
SELECT 'Produtos com estoque NULL' as tipo, COUNT(*) as quantidade FROM produtos WHERE estoque IS NULL;

-- 5. Verificar distribuição de estoque
SELECT 
  CASE 
    WHEN estoque IS NULL THEN 'NULL'
    WHEN estoque = 0 THEN '0'
    WHEN estoque BETWEEN 1 AND 5 THEN '1-5'
    WHEN estoque BETWEEN 6 AND 10 THEN '6-10'
    WHEN estoque > 10 THEN '>10'
  END as faixa_estoque,
  COUNT(*) as quantidade
FROM produtos 
GROUP BY 
  CASE 
    WHEN estoque IS NULL THEN 'NULL'
    WHEN estoque = 0 THEN '0'
    WHEN estoque BETWEEN 1 AND 5 THEN '1-5'
    WHEN estoque BETWEEN 6 AND 10 THEN '6-10'
    WHEN estoque > 10 THEN '>10'
  END
ORDER BY quantidade DESC;

-- 6. Testar a função get_business_summary
SELECT * FROM get_business_summary();

-- 7. Verificar alguns produtos específicos
SELECT id, nome, estoque FROM produtos LIMIT 10;