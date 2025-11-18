-- =====================================================
-- CORREÇÃO: ADICIONAR POLÍTICA DE DELETE PARA MOVIMENTAÇÕES DE ESTOQUE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar políticas existentes
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'movimentacoes_estoque'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 2. Adicionar política de DELETE (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'movimentacoes_estoque' 
    AND schemaname = 'public'
    AND cmd = 'DELETE'
  ) THEN
    -- Criar política para permitir DELETE para usuários autenticados
    CREATE POLICY "Permitir exclusão de movimentações para usuários autenticados"
      ON public.movimentacoes_estoque FOR DELETE
      USING (auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ Política de DELETE criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️  Política de DELETE já existe.';
  END IF;
END $$;

-- 3. Verificar novamente as políticas após a correção
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'movimentacoes_estoque'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- =====================================================
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Teste a exclusão na aplicação
-- 3. Se ainda não funcionar, verifique os logs do navegador
-- =====================================================