-- Verificação de RLS para tabelas acessadas pelo cliente
-- Execute no SQL Editor do Supabase (projeto de produção)
-- Este script lista se o RLS está habilitado e quais políticas existem

-- 1) Verificar se o RLS está habilitado nas tabelas
SELECT 
  relname AS tabela,
  relrowsecurity AS rls_habilitado,
  relforcerowsecurity AS rls_forcado
FROM pg_class
WHERE relname IN ('banners', 'produtos', 'categorias', 'link_instagram', 'pedidos', 'clientes')
ORDER BY relname;

-- 2) Listar políticas RLS existentes nessas tabelas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename IN ('banners', 'produtos', 'categorias', 'link_instagram', 'pedidos', 'clientes')
ORDER BY tablename, policyname;

-- 3) Recomendações comuns (documentação)
-- banners: manter SELECT público com USING (ativo = true)
-- produtos/categorias: geralmente SELECT público apenas de campos não sensíveis (avaliar necessidade)
-- pedidos/clientes: acesso apenas para authenticated; filtrar por user_id proprietário
-- link_instagram: conteúdo público se não houver dados sensíveis

-- 4) Exemplos de políticas (NÃO EXECUTAR SEM REVISÃO)
-- ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Banners visíveis publicamente" ON public.banners
--   FOR SELECT USING (ativo = true);
-- CREATE POLICY "Gerenciar banners (autenticado)" ON public.banners
--   FOR ALL TO authenticated USING (true);