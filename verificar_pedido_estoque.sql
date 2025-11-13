-- Script para verificar o pedido 20252325 e o estoque do produto relacionado
-- Execute este script no SQL Editor do Supabase Studio

-- 1. Verificar se o pedido existe
SELECT 
    id,
    numero_pedido,
    cliente_id,
    status,
    total,
    created_at,
    updated_at
FROM 
    pedidos 
WHERE 
    numero_pedido = '20252325' OR id::text = '20252325';

-- 2. Verificar os itens do pedido
SELECT 
    pi.id,
    pi.pedido_id,
    pi.produto_id,
    pi.quantidade,
    pi.preco_unitario,
    p.nome as produto_nome,
    p.estoque as estoque_atual,
    p.status as produto_status
FROM 
    pedido_itens pi
JOIN 
    produtos p ON pi.produto_id = p.id
WHERE 
    pi.pedido_id IN (SELECT id FROM pedidos WHERE numero_pedido = '20252325' OR id::text = '20252325');

-- 3. Verificar o estoque atual dos produtos vendidos
SELECT 
    p.id,
    p.nome,
    p.estoque,
    p.status,
    COUNT(pi.id) as total_vendas,
    SUM(pi.quantidade) as quantidade_vendida
FROM 
    produtos p
LEFT JOIN 
    pedido_itens pi ON p.id = pi.produto_id
WHERE 
    p.id IN (
        SELECT produto_id 
        FROM pedido_itens 
        WHERE pedido_id IN (
            SELECT id FROM pedidos WHERE numero_pedido = '20252325' OR id::text = '20252325'
        )
    )
GROUP BY 
    p.id, p.nome, p.estoque, p.status;

-- 4. Verificar se há produtos com estoque zero que ainda estão ativos
SELECT 
    id,
    nome,
    estoque,
    status,
    created_at,
    updated_at
FROM 
    produtos
WHERE 
    estoque = 0 
    AND status = 'ativo'
ORDER BY 
    updated_at DESC
LIMIT 10;