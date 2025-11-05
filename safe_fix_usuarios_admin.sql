-- Script SEGURO para adicionar colunas faltantes SEM quebrar o sistema existente
-- Este script preserva completamente a funcionalidade do email especial semprebellasuporte2025@gmail.com

-- 1. Primeiro verificar se as colunas já existem para evitar erros
DO $$
BEGIN
    -- Verificar e adicionar coluna 'tipo' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios_admin' AND column_name = 'tipo'
    ) THEN
        ALTER TABLE public.usuarios_admin ADD COLUMN tipo VARCHAR(50);
        RAISE NOTICE 'Coluna tipo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna tipo já existe';
    END IF;

    -- Verificar e adicionar coluna 'departamento' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios_admin' AND column_name = 'departamento'
    ) THEN
        ALTER TABLE public.usuarios_admin ADD COLUMN departamento VARCHAR(100);
        RAISE NOTICE 'Coluna departamento adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna departamento já existe';
    END IF;

    -- Verificar e adicionar coluna 'cargo' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios_admin' AND column_name = 'cargo'
    ) THEN
        ALTER TABLE public.usuarios_admin ADD COLUMN cargo VARCHAR(100);
        RAISE NOTICE 'Coluna cargo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna cargo já existe';
    END IF;

    -- Verificar e adicionar coluna 'data_admissao' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios_admin' AND column_name = 'data_admissao'
    ) THEN
        ALTER TABLE public.usuarios_admin ADD COLUMN data_admissao DATE;
        RAISE NOTICE 'Coluna data_admissao adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna data_admissao já existe';
    END IF;
END $$;

-- 2. Atualizar registros existentes APENAS se necessário (não força valores)
UPDATE public.usuarios_admin 
SET 
    tipo = COALESCE(tipo, 'admin'),
    departamento = COALESCE(departamento, 'Administração'), 
    cargo = COALESCE(cargo, 'Administrador'),
    data_admissao = COALESCE(data_admissao, CURRENT_DATE)
WHERE tipo IS NULL OR departamento IS NULL OR cargo IS NULL OR data_admissao IS NULL;

-- 3. Verificar o resultado
SELECT 
    COUNT(*) as total_administradores,
    COUNT(CASE WHEN tipo IS NOT NULL THEN 1 END) as com_tipo,
    COUNT(CASE WHEN departamento IS NOT NULL THEN 1 END) as com_departamento,
    COUNT(CASE WHEN cargo IS NOT NULL THEN 1 END) as com_cargo,
    COUNT(CASE WHEN data_admissao IS NOT NULL THEN 1 END) as com_data_admissao
FROM public.usuarios_admin;

-- 4. IMPORTANTE: Garantir que o sistema continue funcionando independentemente da tabela
-- O email semprebellasuporte2025@gmail.com SEMPRE será administrador por fallback no código
RAISE NOTICE '✅ Sistema preservado: email semprebellasuporte2025@gmail.com continua funcionando como administrador';
RAISE NOTICE '✅ Tabela usuarios_admin atualizada sem quebrar funcionalidades existentes';