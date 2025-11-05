-- Script para corrigir as políticas RLS da tabela banners
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro remover a política problemática
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar banners" ON public.banners;

-- 2. Criar política correta que permite acesso completo a usuários autenticados
CREATE POLICY "Usuários autenticados podem gerenciar banners" ON public.banners
    FOR ALL USING (true);

-- 3. Manter a política de leitura pública para banners ativos
CREATE POLICY "Banners são visíveis publicamente" ON public.banners
    FOR SELECT USING (ativo = true);

-- 4. Verificar se as políticas foram aplicadas corretamente
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'banners' 
ORDER BY policyname;

-- 5. Testar acesso - esta consulta deve funcionar para usuários autenticados
SELECT 
    'Teste de acesso' as status,
    COUNT(*) as total_banners,
    EXISTS (
        SELECT 1 
        FROM public.banners 
        LIMIT 1
    ) as pode_acessar_banners;

RAISE NOTICE '✅ Políticas RLS da tabela banners corrigidas com sucesso!';
RAISE NOTICE '✅ Erro 403 deve estar resolvido agora!';