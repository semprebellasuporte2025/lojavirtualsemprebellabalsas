-- Criação da tabela usuarios_admin para gerenciar usuários administrativos
CREATE TABLE IF NOT EXISTS public.usuarios_admin (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo VARCHAR(50) DEFAULT 'admin',
    departamento VARCHAR(100) DEFAULT 'Administração',
    cargo VARCHAR(100) DEFAULT 'Administrador',
    data_admissao DATE DEFAULT CURRENT_DATE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON public.usuarios_admin(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_ativo ON public.usuarios_admin(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_tipo ON public.usuarios_admin(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_departamento ON public.usuarios_admin(departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_data_admissao ON public.usuarios_admin(data_admissao);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.usuarios_admin ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para recriar)
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar administradores" ON public.usuarios_admin;
DROP POLICY IF EXISTS "Administradores podem ver todos os usuários admin" ON public.usuarios_admin;
DROP POLICY IF EXISTS "Administradores podem gerenciar seus próprios dados" ON public.usuarios_admin;
DROP POLICY IF EXISTS "Administradores podem ver outros administradores" ON public.usuarios_admin;
DROP POLICY IF EXISTS "Usuários autenticados podem criar administradores" ON public.usuarios_admin;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar administradores" ON public.usuarios_admin;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir administradores" ON public.usuarios_admin;

-- Política para permitir que usuários autenticados vejam todos os administradores
CREATE POLICY "Administradores podem gerenciar seus próprios dados"
ON public.usuarios_admin
FOR ALL
TO authenticated
USING (
  (SELECT auth.uid()) = id
)
WITH CHECK (
  (SELECT auth.uid()) = id
);

-- Política para permitir que administradores vejam outros administradores
CREATE POLICY "Administradores podem ver outros administradores"
ON public.usuarios_admin
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir que usuários autenticados criem administradores
CREATE POLICY "Usuários autenticados podem criar administradores"
ON public.usuarios_admin
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir que usuários autenticados atualizem administradores
CREATE POLICY "Usuários autenticados podem atualizar administradores"
ON public.usuarios_admin
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir que usuários autenticados excluam administradores
CREATE POLICY "Usuários autenticados podem excluir administradores"
ON public.usuarios_admin
FOR DELETE
TO authenticated
USING (true);

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_usuarios_admin_updated_at ON public.usuarios_admin;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_usuarios_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_usuarios_admin_updated_at
    BEFORE UPDATE ON public.usuarios_admin
    FOR EACH ROW
    EXECUTE FUNCTION update_usuarios_admin_updated_at();

-- Conceder permissões
GRANT SELECT ON public.usuarios_admin TO anon, authenticated;
GRANT ALL ON public.usuarios_admin TO service_role;

-- Comentários na tabela e colunas
COMMENT ON TABLE public.usuarios_admin IS 'Tabela de usuários administrativos do sistema';
COMMENT ON COLUMN public.usuarios_admin.id IS 'ID do usuário (referência à tabela auth.users)';
COMMENT ON COLUMN public.usuarios_admin.nome IS 'Nome completo do usuário administrativo';
COMMENT ON COLUMN public.usuarios_admin.email IS 'Email do usuário administrativo (único)';
COMMENT ON COLUMN public.usuarios_admin.tipo IS 'Tipo de usuário administrativo (admin, atendente, etc.)';
COMMENT ON COLUMN public.usuarios_admin.departamento IS 'Departamento do usuário na empresa';
COMMENT ON COLUMN public.usuarios_admin.cargo IS 'Cargo/função do usuário na empresa';
COMMENT ON COLUMN public.usuarios_admin.data_admissao IS 'Data de admissão do usuário na empresa';
COMMENT ON COLUMN public.usuarios_admin.ativo IS 'Indica se o usuário administrativo está ativo';
COMMENT ON COLUMN public.usuarios_admin.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.usuarios_admin.updated_at IS 'Data da última atualização do registro';

-- Inserir o usuário administrador atual (se necessário)
-- INSERT INTO public.usuarios_admin (id, nome, email, tipo, departamento, cargo, data_admissao, ativo)
-- VALUES (
--     'ca44d763-8328-4e40-ad22-33d13d3d3e98',
--     'Suporte Sempre Bella',
--     'semprebellasuporte2025@gmail.com',
--     'super_admin',
--     'Tecnologia',
--     'Administrador do Sistema',
--     CURRENT_DATE,
--     true
-- )
-- ON CONFLICT (id) DO UPDATE SET
--     nome = EXCLUDED.nome,
--     email = EXCLUDED.email,
--     tipo = EXCLUDED.tipo,
--     departamento = EXCLUDED.departamento,
--     cargo = EXCLUDED.cargo,
--     data_admissao = EXCLUDED.data_admissao,
--     ativo = EXCLUDED.ativo;