-- Migração para corrigir políticas RLS da tabela banners
-- Data: 2025-01-01
-- Descrição: Corrige políticas RLS para garantir visibilidade pública dos banners e acesso restrito a administradores

-- Habilitar RLS (caso não esteja habilitada)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Banners são visíveis publicamente" ON public.banners;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar banners" ON public.banners;
DROP POLICY IF EXISTS "Administradores podem gerenciar banners" ON public.banners;

-- Política para leitura pública (qualquer usuário pode ver banners ativos)
CREATE POLICY "Banners são visíveis publicamente" ON public.banners
    FOR SELECT USING (ativo = true);

-- Política para administradores (CRUD completo)
CREATE POLICY "Administradores podem gerenciar banners" ON public.banners
    FOR ALL USING (auth.role() = 'authenticated' AND 
                 EXISTS (SELECT 1 FROM public.usuarios_admin WHERE id = auth.uid() AND ativo = true));

-- Conceder permissões (garantir que estão corretas)
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT ALL ON public.banners TO service_role;

-- Comentário para documentação
COMMENT ON POLICY "Banners são visíveis publicamente" ON public.banners IS 'Permite que qualquer usuário (incluindo anônimos) veja banners ativos';
COMMENT ON POLICY "Administradores podem gerenciar banners" ON public.banners IS 'Permite que administradores autenticados realizem operações CRUD completas na tabela banners';

-- Verificar se as políticas foram aplicadas corretamente
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'banners' 
ORDER BY policyname;