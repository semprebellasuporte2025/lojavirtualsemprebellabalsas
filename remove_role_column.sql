-- Script para remover a coluna 'role' da tabela usuarios_admin caso ela exista
-- Esta coluna não é utilizada pelo sistema, apenas o campo 'tipo' é utilizado

-- Verificar se a coluna 'role' existe na tabela
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios_admin' 
        AND column_name = 'role'
    ) THEN
        -- Remover a coluna 'role' se existir
        ALTER TABLE public.usuarios_admin DROP COLUMN role;
        RAISE NOTICE 'Coluna role removida com sucesso da tabela usuarios_admin';
    ELSE
        RAISE NOTICE 'Coluna role não existe na tabela usuarios_admin';
    END IF;
END $$;

-- Verificar a estrutura atual da tabela após a operação
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'usuarios_admin'
ORDER BY 
    ordinal_position;