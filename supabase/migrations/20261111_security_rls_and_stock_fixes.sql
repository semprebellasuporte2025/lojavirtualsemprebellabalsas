-- =============================================================================
-- Migration: Hardening de RLS, permissões de anon/authenticated, leitura segura
--            de cupons ativos e correção de reversão de estoque por variante.
-- Data: 2026-11-11
-- =============================================================================

BEGIN;

-- 1. Funções auxiliares de autorização (SECURITY DEFINER sem recursão de RLS)
DO $$
DECLARE
  has_admin_user_id boolean;
  has_cliente_user_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios_admin' AND column_name = 'user_id'
  ) INTO has_admin_user_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'user_id'
  ) INTO has_cliente_user_id;

  IF has_admin_user_id THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_active_admin()
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT EXISTS (
          SELECT 1
          FROM public.usuarios_admin ua
          WHERE (ua.id = auth.uid() OR ua.user_id = auth.uid())
            AND ua.ativo = true
            AND lower(COALESCE(ua.tipo, 'admin')) IN ('admin', 'administrador', 'administrator')
        );
      $body$;
    $fn$;

    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_active_staff()
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT EXISTS (
          SELECT 1
          FROM public.usuarios_admin ua
          WHERE (ua.id = auth.uid() OR ua.user_id = auth.uid())
            AND ua.ativo = true
            AND lower(COALESCE(ua.tipo, 'admin')) IN ('admin', 'administrador', 'administrator', 'atendente')
        );
      $body$;
    $fn$;
  ELSE
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_active_admin()
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT EXISTS (
          SELECT 1
          FROM public.usuarios_admin ua
          WHERE ua.id = auth.uid()
            AND ua.ativo = true
            AND lower(COALESCE(ua.tipo, 'admin')) IN ('admin', 'administrador', 'administrator')
        );
      $body$;
    $fn$;

    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_active_staff()
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT EXISTS (
          SELECT 1
          FROM public.usuarios_admin ua
          WHERE ua.id = auth.uid()
            AND ua.ativo = true
            AND lower(COALESCE(ua.tipo, 'admin')) IN ('admin', 'administrador', 'administrator', 'atendente')
        );
      $body$;
    $fn$;
  END IF;

  IF has_cliente_user_id THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_cliente_owner(target_cliente_id UUID)
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT auth.uid() IS NOT NULL AND (
          target_cliente_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.clientes c
            WHERE c.id = target_cliente_id
              AND (
                c.user_id = auth.uid()
                OR c.id = auth.uid()
                OR (
                  COALESCE(auth.jwt() ->> 'email', '') <> ''
                  AND lower(COALESCE(c.email, '')) = lower(auth.jwt() ->> 'email')
                )
              )
          )
        );
      $body$;
    $fn$;
  ELSE
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_cliente_owner(target_cliente_id UUID)
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT auth.uid() IS NOT NULL AND (
          target_cliente_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.clientes c
            WHERE c.id = target_cliente_id
              AND (
                c.id = auth.uid()
                OR (
                  COALESCE(auth.jwt() ->> 'email', '') <> ''
                  AND lower(COALESCE(c.email, '')) = lower(auth.jwt() ->> 'email')
                )
              )
          )
        );
      $body$;
    $fn$;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_cliente_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_cliente_owner(UUID) TO authenticated;

-- 2. Blindar usuarios_admin
ALTER TABLE IF EXISTS public.usuarios_admin ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.usuarios_admin FROM anon;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'usuarios_admin'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios_admin', r.policyname);
  END LOOP;
END $$;

CREATE POLICY usuarios_admin_select_self_or_admin
  ON public.usuarios_admin FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_active_admin());

CREATE POLICY usuarios_admin_manage_admin_only
  ON public.usuarios_admin FOR ALL
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 3. Blindar clientes
ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.clientes FROM anon;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clientes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.clientes', r.policyname);
  END LOOP;
END $$;

CREATE POLICY clientes_select_owner_or_staff
  ON public.clientes FOR SELECT
  TO authenticated
  USING (public.is_active_staff() OR public.is_cliente_owner(id));

CREATE POLICY clientes_insert_owner_or_staff
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_active_staff()
    OR id = auth.uid()
    OR (
      COALESCE(auth.jwt() ->> 'email', '') <> ''
      AND lower(COALESCE(email, '')) = lower(auth.jwt() ->> 'email')
    )
  );

CREATE POLICY clientes_update_owner_or_staff
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (public.is_active_staff() OR public.is_cliente_owner(id))
  WITH CHECK (public.is_active_staff() OR public.is_cliente_owner(id));

CREATE POLICY clientes_delete_admin_only
  ON public.clientes FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- 4. Blindar pedidos (remover acesso de anon e UPDATE/DELETE irrestritos)
ALTER TABLE IF EXISTS public.pedidos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pedidos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pedidos TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pedidos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pedidos', r.policyname);
  END LOOP;
END $$;

CREATE POLICY pedidos_select_owner_or_staff
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (public.is_active_staff() OR public.is_cliente_owner(cliente_id));

CREATE POLICY pedidos_insert_owner_or_staff
  ON public.pedidos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_staff() OR public.is_cliente_owner(cliente_id));

CREATE POLICY pedidos_update_staff_only
  ON public.pedidos FOR UPDATE
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

CREATE POLICY pedidos_delete_admin_only
  ON public.pedidos FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- 5. Blindar itens_pedido
ALTER TABLE IF EXISTS public.itens_pedido ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.itens_pedido FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.itens_pedido TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'itens_pedido'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.itens_pedido', r.policyname);
  END LOOP;
END $$;

CREATE POLICY itens_pedido_select_owner_or_staff
  ON public.itens_pedido FOR SELECT
  TO authenticated
  USING (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = pedido_id AND public.is_cliente_owner(p.cliente_id)
    )
  );

CREATE POLICY itens_pedido_insert_owner_or_staff
  ON public.itens_pedido FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_active_staff()
    OR EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = pedido_id AND public.is_cliente_owner(p.cliente_id)
    )
  );

CREATE POLICY itens_pedido_update_staff_only
  ON public.itens_pedido FOR UPDATE
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

CREATE POLICY itens_pedido_delete_admin_only
  ON public.itens_pedido FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- 6. Leitura segura de cupons ativos para checkout/carrinho
DO $$
BEGIN
  IF to_regclass('public.cupons') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT ON TABLE public.cupons TO anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS cupons_public_active_select ON public.cupons';
    EXECUTE $pol$
      CREATE POLICY cupons_public_active_select
        ON public.cupons FOR SELECT
        TO anon, authenticated
        USING (
          status = 'ativo'
          AND (inicio_em IS NULL OR inicio_em <= now())
          AND (fim_em IS NULL OR fim_em >= now())
        );
    $pol$;
  END IF;
END $$;

-- 7. Corrigir reversão de estoque no cancelamento de pedido para casar cor/tamanho exatos
CREATE OR REPLACE FUNCTION public.reverter_estoque_cancelamento_variante()
RETURNS TRIGGER AS $$
DECLARE
  v_variante_id UUID;
  item_record RECORD;
  v_already_reverted BOOLEAN;
BEGIN
  IF NEW.status = 'cancelado' AND OLD.status IS DISTINCT FROM 'cancelado' THEN
    FOR item_record IN
      SELECT * FROM public.itens_pedido
      WHERE pedido_id = NEW.id
    LOOP
      -- Evitar reversão duplicada para o mesmo pedido/produto
      SELECT EXISTS (
        SELECT 1 FROM public.movimentacoes_estoque
        WHERE produto_id = item_record.produto_id::UUID
          AND motivo = 'Cancelamento de pedido'
          AND observacoes LIKE '%' || COALESCE(NEW.numero_pedido, '') || '%'
      ) INTO v_already_reverted;

      IF v_already_reverted THEN
        CONTINUE;
      END IF;

      -- 1ª tentativa: casar produto + cor + tamanho exatos
      SELECT id INTO v_variante_id
      FROM public.variantes_produto
      WHERE produto_id = item_record.produto_id::UUID
        AND (
          NULLIF(trim(COALESCE(item_record.cor, '')), '') IS NULL
          OR lower(trim(COALESCE(cor, ''))) = lower(trim(item_record.cor))
        )
        AND (
          NULLIF(trim(COALESCE(item_record.tamanho, '')), '') IS NULL
          OR lower(trim(COALESCE(tamanho, ''))) = lower(trim(item_record.tamanho))
        )
      ORDER BY ativo DESC, created_at ASC
      LIMIT 1;

      -- 2ª tentativa (fallback): primeira variação ativa do produto
      IF v_variante_id IS NULL THEN
        SELECT id INTO v_variante_id
        FROM public.variantes_produto
        WHERE produto_id = item_record.produto_id::UUID
          AND ativo = true
        ORDER BY created_at ASC
        LIMIT 1;
      END IF;

      IF v_variante_id IS NULL THEN
        INSERT INTO public.variantes_produto (
          produto_id, cor, tamanho, estoque, ativo, sku
        ) VALUES (
          item_record.produto_id::UUID,
          COALESCE(NULLIF(trim(item_record.cor), ''), 'Padrão'),
          COALESCE(NULLIF(trim(item_record.tamanho), ''), 'Único'),
          0,
          true,
          'DEFAULT-' || item_record.produto_id
        ) RETURNING id INTO v_variante_id;
      END IF;

      UPDATE public.variantes_produto
      SET estoque = COALESCE(estoque, 0) + item_record.quantidade,
          updated_at = NOW()
      WHERE id = v_variante_id;

      INSERT INTO public.movimentacoes_estoque (
        produto_id,
        tipo,
        quantidade,
        valor_unitario,
        valor_total,
        motivo,
        observacoes,
        usuario_nome
      ) VALUES (
        item_record.produto_id::UUID,
        'entrada',
        item_record.quantidade,
        item_record.preco_unitario,
        item_record.subtotal,
        'Cancelamento de pedido',
        'Cancelamento - Pedido: ' || COALESCE(NEW.numero_pedido, NEW.id::text),
        'Sistema - Cancelamento Automático'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
