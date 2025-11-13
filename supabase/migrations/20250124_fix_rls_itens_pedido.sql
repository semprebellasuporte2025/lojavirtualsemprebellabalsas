-- Ajusta permissões e políticas RLS para permitir inserção em itens_pedido
-- Execute este script no Supabase Studio (SQL Editor) ou via CLI de migrações

-- Garantir que a tabela existe e RLS esteja habilitada
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- Conceder permissões básicas
GRANT SELECT ON TABLE public.itens_pedido TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.itens_pedido TO authenticated;

-- Remover políticas antigas para evitar conflitos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'itens_pedido'
  ) THEN
    -- Dropar todas as políticas existentes na tabela
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(polname) || ' ON public.itens_pedido;', ' ')
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'itens_pedido'
    );
  END IF;
END$$;

-- Políticas explícitas
CREATE POLICY itens_pedido_select_authenticated
  ON public.itens_pedido
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY itens_pedido_insert_authenticated
  ON public.itens_pedido
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY itens_pedido_update_authenticated
  ON public.itens_pedido
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY itens_pedido_delete_authenticated
  ON public.itens_pedido
  FOR DELETE
  TO authenticated
  USING (true);

-- Comentários informativos
COMMENT ON POLICY itens_pedido_insert_authenticated ON public.itens_pedido IS 'Permite que usuários autenticados insiram itens de pedido';
COMMENT ON POLICY itens_pedido_select_authenticated ON public.itens_pedido IS 'Permite que usuários autenticados leiam itens de pedido';