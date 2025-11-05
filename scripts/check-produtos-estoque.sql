-- Script para verificar produtos e estoques
SELECT 
    p.id,
    p.nome,
    p.estoque as estoque_produto,
    p.ativo,
    COUNT(v.id) as total_variantes,
    SUM(v.estoque) as total_estoque_variantes,
    STRING_AGG(CONCAT(v.tamanho, ' (', v.cor, '): ', v.estoque), ', ') as variantes_info
FROM public.produtos p
LEFT JOIN public.variantes_produto v ON p.id = v.produto_id
WHERE p.nome ILIKE '%jeans%' OR p.nome ILIKE '%wide leg%' OR p.nome ILIKE '%calça%'
GROUP BY p.id, p.nome, p.estoque, p.ativo
ORDER BY p.nome;

-- Verificar também produtos com estoque zerado
SELECT 
    id,
    nome,
    estoque,
    ativo
FROM public.produtos 
WHERE estoque = 0 AND ativo = true
ORDER BY nome;