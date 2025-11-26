-- Verificar RLS na tabela pedidos
-- Execute no SQL Editor do Supabase

-- RLS habilitado?
SELECT relname AS tabela, relrowsecurity AS rls_habilitado, relforcerowsecurity AS rls_forcado
FROM pg_class WHERE relname = 'pedidos';

-- Políticas definidas
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'pedidos' ORDER BY policyname;