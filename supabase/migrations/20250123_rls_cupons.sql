-- Migração para corrigir políticas RLS das tabelas de cupons
-- Data: 2025-01-23
-- Descrição: Usa a coluna correta em public.usuarios_admin para checagem de administrador

-- Habilitar RLS nas tabelas (se ainda não estiver)
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupom_redencoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS cupons_admin_select ON public.cupons;
DROP POLICY IF EXISTS cupons_admin_insert ON public.cupons;
DROP POLICY IF EXISTS cupons_admin_update ON public.cupons;
DROP POLICY IF EXISTS cupons_admin_delete ON public.cupons;
DROP POLICY IF EXISTS redencoes_cliente_select ON public.cupom_redencoes;
DROP POLICY IF EXISTS redencoes_admin_select ON public.cupom_redencoes;

-- Política: admins podem selecionar cupons
CREATE POLICY cupons_admin_select ON public.cupons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_admin ua
      WHERE ua.id = auth.uid() AND ua.ativo = true
    )
  );

-- Políticas: admins podem inserir/atualizar/excluir cupons
CREATE POLICY cupons_admin_insert ON public.cupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usuarios_admin ua
      WHERE ua.id = auth.uid() AND ua.ativo = true
    )
  );

CREATE POLICY cupons_admin_update ON public.cupons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_admin ua
      WHERE ua.id = auth.uid() AND ua.ativo = true
    )
  );

CREATE POLICY cupons_admin_delete ON public.cupons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_admin ua
      WHERE ua.id = auth.uid() AND ua.ativo = true
    )
  );

-- Política: cliente pode ver apenas suas próprias redenções
CREATE POLICY redencoes_cliente_select ON public.cupom_redencoes
  FOR SELECT
  USING (usuario_id = auth.uid());

-- Política: admins podem ver todas as redenções
CREATE POLICY redencoes_admin_select ON public.cupom_redencoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_admin ua
      WHERE ua.id = auth.uid() AND ua.ativo = true
    )
  );

-- Concessões (garantir leitura pelas roles padrão)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons TO authenticated;
GRANT SELECT ON public.cupom_redencoes TO authenticated;
GRANT ALL ON public.cupons, public.cupom_redencoes TO service_role;

-- Comentários para documentação
COMMENT ON POLICY cupons_admin_select ON public.cupons IS 'Permite leitura de cupons aos administradores ativos';
COMMENT ON POLICY redencoes_cliente_select ON public.cupom_redencoes IS 'Clientes só leem suas próprias redenções';
COMMENT ON POLICY redencoes_admin_select ON public.cupom_redencoes IS 'Administradores podem ler todas as redenções';