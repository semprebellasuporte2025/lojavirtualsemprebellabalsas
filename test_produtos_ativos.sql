-- Script para verificar produtos ativos
-- Execute este script no Supabase SQL Editor

-- 1. Total de produtos cadastrados
SELECT 'Total de produtos cadastrados' as info, COUNT(*) as quantidade
FROM produtos;

-- 2. Produtos com estoque > 0
SELECT 'Produtos com estoque > 0' as info, COUNT(*) as quantidade
FROM produtos 
WHERE estoque > 0;

-- 3. Produtos com estoque = 0
SELECT 'Produtos com estoque = 0' as info, COUNT(*) as quantidade
FROM produtos 
WHERE estoque = 0;

-- 4. Produtos com estoque NULL
SELECT 'Produtos com estoque NULL' as info, COUNT(*) as quantidade
FROM produtos 
WHERE estoque IS NULL;

-- 5. Distribuição de estoque
SELECT 
  CASE 
    WHEN estoque IS NULL THEN 'NULL'
    WHEN estoque = 0 THEN '0'
    WHEN estoque BETWEEN 1 AND 5 THEN '1-5'
    WHEN estoque BETWEEN 6 AND 10 THEN '6-10'
    WHEN estoque BETWEEN 11 AND 20 THEN '11-20'
    ELSE '20+'
  END as faixa_estoque,
  COUNT(*) as quantidade
FROM produtos
GROUP BY 
  CASE 
    WHEN estoque IS NULL THEN 'NULL'
    WHEN estoque = 0 THEN '0'
    WHEN estoque BETWEEN 1 AND 5 THEN '1-5'
    WHEN estoque BETWEEN 6 AND 10 THEN '6-10'
    WHEN estoque BETWEEN 11 AND 20 THEN '11-20'
    ELSE '20+'
  END
ORDER BY 
  CASE 
    WHEN faixa_estoque = 'NULL' THEN 0
    WHEN faixa_estoque = '0' THEN 1
    WHEN faixa_estoque = '1-5' THEN 2
    WHEN faixa_estoque = '6-10' THEN 3
    WHEN faixa_estoque = '11-20' THEN 4
    ELSE 5
  END;

-- 6. Testar função get_business_summary (se existir)
SELECT 'Resultado da função get_business_summary' as info;
SELECT * FROM get_business_summary();

-- 7. Verificar alguns produtos específicos
SELECT 'Primeiros 10 produtos com seus estoques' as info;
SELECT id, nome, estoque, preco, categoria_id
FROM produtos
ORDER BY id
LIMIT 10;