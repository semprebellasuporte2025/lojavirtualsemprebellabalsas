-- Script para verificar a estrutura da tabela pedidos
-- Execute este script no SQL Editor do Supabase Studio

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'pedidos'
ORDER BY 
    ordinal_position;

-- Verificar se a tabela existe e tem dados
SELECT 
    'pedidos' as tabela,
    COUNT(*) as total_registros,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pedidos') as tabela_existe
FROM 
    pedidos;

-- Verificar se a coluna cliente_id existe
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'cliente_id'
    ) as cliente_id_existe;

-- Verificar se há dados na tabela pedidos
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(DISTINCT id) as pedidos_unicos,
    COUNT(cliente_id) as pedidos_com_cliente_id,
    MIN(created_at) as primeiro_pedido,
    MAX(created_at) as ultimo_pedido
FROM 
    pedidos;