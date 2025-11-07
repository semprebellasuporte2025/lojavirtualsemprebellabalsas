-- Script para remover a coluna 'data_admissao' da tabela usuarios_admin
-- Esta coluna foi solicitada para remoção pelo usuário

-- Verificar se a coluna 'data_admissao' existe na tabela
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios_admin' 
        AND column_name = 'data_admissao'
    ) THEN
        -- Remover a coluna 'data_admissao' se existir
        ALTER TABLE public.usuarios_admin DROP COLUMN data_admissao;
        RAISE NOTICE 'Coluna data_admissao removida com sucesso da tabela usuarios_admin';
    ELSE
        RAISE NOTICE 'Coluna data_admissao não existe na tabela usuarios_admin';
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