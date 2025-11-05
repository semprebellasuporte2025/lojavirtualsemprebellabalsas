-- Script para verificar a estrutura da tabela clientes
-- Execute este script no SQL Editor do Supabase Studio

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'clientes'
ORDER BY 
    ordinal_position;