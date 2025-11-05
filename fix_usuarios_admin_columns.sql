-- Script para corrigir a estrutura da tabela usuarios_admin
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, verificar a estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'usuarios_admin'
ORDER BY 
    ordinal_position;

-- 2. Adicionar a coluna 'tipo' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'tipo') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN tipo VARCHAR(50) DEFAULT 'admin';
        RAISE NOTICE 'Coluna tipo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna tipo já existe';
    END IF;
END $$;

-- 3. Adicionar a coluna 'departamento' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'departamento') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN departamento VARCHAR(100) DEFAULT 'Administração';
        RAISE NOTICE 'Coluna departamento adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna departamento já existe';
    END IF;
END $$;

-- 4. Adicionar a coluna 'cargo' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'cargo') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN cargo VARCHAR(100) DEFAULT 'Administrador';
        RAISE NOTICE 'Coluna cargo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna cargo já existe';
    END IF;
END $$;

-- 5. Adicionar a coluna 'data_admissao' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'data_admissao') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN data_admissao DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Coluna data_admissao adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna data_admissao já existe';
    END IF;
END $$;

-- 6. Atualizar registros existentes com valores padrão
UPDATE public.usuarios_admin 
SET 
    tipo = COALESCE(tipo, 'admin'),
    departamento = COALESCE(departamento, 'Administração'),
    cargo = COALESCE(cargo, 'Administrador'),
    data_admissao = COALESCE(data_admissao, CURRENT_DATE)
WHERE 
    tipo IS NULL OR 
    departamento IS NULL OR 
    cargo IS NULL OR 
    data_admissao IS NULL;

-- 7. Verificar a estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'usuarios_admin'
ORDER BY 
    ordinal_position;

-- 8. Verificar os dados atualizados
SELECT 
    id, 
    nome, 
    email, 
    tipo, 
    departamento,
    cargo,
    data_admissao,
    ativo
FROM 
    public.usuarios_admin;