-- Corrige políticas RLS da tabela link_instagram para permitir INSERT/UPDATE/DELETE por usuários autenticados
-- Execute este script no Editor SQL do Supabase (projeto em produção e/ou desenvolvimento)

BEGIN;

-- Garantir que RLS está habilitado
ALTER TABLE public.link_instagram ENABLE ROW LEVEL SECURITY;

-- Remover política antiga genérica, que pode não cobrir WITH CHECK corretamente
DROP POLICY IF EXISTS "Permitir administradores gerenciarem links" ON public.link_instagram;

-- Leitura pública dos links ativos já deve existir; manter se presente
-- Caso queira garantir, descomente a linha abaixo:
-- CREATE POLICY IF NOT EXISTS "link_instagram_select_public_active" ON public.link_instagram
--   FOR SELECT TO public USING (ativo = true);

-- Leitura para usuários autenticados (admin/painel) de todos os registros
CREATE POLICY IF NOT EXISTS "link_instagram_select_authenticated_all" ON public.link_instagram
  FOR SELECT TO authenticated USING (true);

-- Inserção por usuários autenticados (painel admin)
CREATE POLICY IF NOT EXISTS "link_instagram_insert_authenticated" ON public.link_instagram
  FOR INSERT TO authenticated WITH CHECK (true);

-- Atualização por usuários autenticados (painel admin)
CREATE POLICY IF NOT EXISTS "link_instagram_update_authenticated" ON public.link_instagram
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Exclusão por usuários autenticados (painel admin)
CREATE POLICY IF NOT EXISTS "link_instagram_delete_authenticated" ON public.link_instagram
  FOR DELETE TO authenticated USING (true);

-- Conceder privilégios básicos
GRANT SELECT ON public.link_instagram TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.link_instagram TO authenticated;

COMMIT;

-- Observações:
-- 1) Se sua tabela ainda não tiver a coluna ordem_exibicao ou campos de topo (img_topo, linktopo_img_, descricao_topo),
--    execute também: supabase/fix_link_instagram_table.sql e supabase/migrations/20251107_add_ordem_exibicao_to_link_instagram.sql
-- 2) Após aplicar, teste operações no painel: cadastrar, editar, reordenar e excluir.