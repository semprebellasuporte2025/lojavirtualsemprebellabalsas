-- =====================================================
-- SCRIPT DE VERIFICAÇÃO DA TABELA DE MOVIMENTAÇÕES
-- Execute após rodar o script principal para verificar se tudo está OK
-- =====================================================

-- 1. Verificar se a tabela foi criada
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'movimentacoes_estoque';

-- 2. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'movimentacoes_estoque'
ORDER BY ordinal_position;

-- 3. Verificar índices criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'movimentacoes_estoque'
AND schemaname = 'public';

-- 4. Verificar triggers criados
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'movimentacoes_estoque'
AND event_object_schema = 'public';

-- 5. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'movimentacoes_estoque'
AND schemaname = 'public';

-- 6. Verificar se há dados de exemplo
SELECT 
  COUNT(*) as total_movimentacoes,
  COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as entradas,
  COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as saidas,
  COUNT(CASE WHEN tipo = 'ajuste' THEN 1 END) as ajustes
FROM public.movimentacoes_estoque;

-- 7. Verificar se a coluna estoque foi adicionada na tabela produtos
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'produtos'
AND column_name = 'estoque';

-- 8. Mostrar algumas movimentações de exemplo (se existirem)
SELECT 
  id,
  tipo,
  quantidade,
  valor_unitario,
  valor_total,
  fornecedor_nome,
  usuario_nome,
  created_at
FROM public.movimentacoes_estoque 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- Se todos os comandos acima retornaram resultados,
-- a tabela foi criada com sucesso!
-- =====================================================