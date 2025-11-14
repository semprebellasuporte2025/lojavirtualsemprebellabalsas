-- Script para verificar se o campo estoque ainda existe na tabela produtos
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'produtos'
ORDER BY ordinal_position;