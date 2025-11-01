-- Migração para adicionar colunas ausentes na tabela usuarios_admin
-- Data: 2025-01-22
-- Descrição: Adiciona campos tipo, departamento, cargo e data_admissao

-- Adicionar coluna 'tipo' (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'tipo') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN tipo VARCHAR(50) DEFAULT 'admin';
    END IF;
END $$;

-- Adicionar coluna 'departamento' (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'departamento') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN departamento VARCHAR(100) DEFAULT 'Administração';
    END IF;
END $$;

-- Adicionar coluna 'cargo' (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'cargo') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN cargo VARCHAR(100) DEFAULT 'Administrador';
    END IF;
END $$;

-- Adicionar coluna 'data_admissao' (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_admin' AND column_name = 'data_admissao') THEN
        ALTER TABLE public.usuarios_admin 
        ADD COLUMN data_admissao DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Atualizar registros existentes com valores padrão (apenas se os campos estiverem nulos)
UPDATE public.usuarios_admin 
SET 
    tipo = COALESCE(tipo, 'admin'),
    departamento = COALESCE(departamento, 'Administração'),
    cargo = COALESCE(cargo, 'Administrador'),
    data_admissao = COALESCE(data_admissao, CURRENT_DATE)
WHERE tipo IS NULL OR departamento IS NULL OR cargo IS NULL OR data_admissao IS NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.usuarios_admin.tipo IS 'Tipo de usuário administrativo (admin, super_admin, etc.)';
COMMENT ON COLUMN public.usuarios_admin.departamento IS 'Departamento do usuário na empresa';
COMMENT ON COLUMN public.usuarios_admin.cargo IS 'Cargo/função do usuário na empresa';
COMMENT ON COLUMN public.usuarios_admin.data_admissao IS 'Data de admissão do usuário na empresa';

-- Criar índices para melhor performance (opcionais)
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_tipo ON public.usuarios_admin(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_departamento ON public.usuarios_admin(departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_data_admissao ON public.usuarios_admin(data_admissao);