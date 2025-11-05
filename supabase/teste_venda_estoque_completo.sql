-- =====================================================
-- TESTE COMPLETO DE VENDA COM BAIXA AUTOMÁTICA NO ESTOQUE
-- Execute após aplicar todos os scripts de integração
-- =====================================================

-- 1. Verificar se os triggers estão ativos
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_registrar_venda_estoque',
  'trigger_reverter_estoque_cancelamento'
)
ORDER BY trigger_name;

-- 2. Verificar produtos disponíveis para teste
SELECT 
  id,
  nome,
  preco,
  estoque,
  'Produto disponível para teste' as status
FROM public.produtos 
WHERE estoque > 5
ORDER BY estoque DESC
LIMIT 5;

-- 3. SIMULAÇÃO DE VENDA COMPLETA
-- ATENÇÃO: Este bloco fará uma venda real no sistema!
DO $$
DECLARE
  produto_teste UUID;
  pedido_teste UUID;
  estoque_antes INTEGER;
  estoque_depois INTEGER;
  movimentacoes_antes INTEGER;
  movimentacoes_depois INTEGER;
  numero_pedido_teste TEXT;
BEGIN
  -- Contar movimentações antes do teste
  SELECT COUNT(*) INTO movimentacoes_antes 
  FROM public.movimentacoes_estoque;
  
  -- Pegar um produto com estoque para teste
  SELECT id, estoque INTO produto_teste, estoque_antes
  FROM public.produtos 
  WHERE estoque > 5 
  LIMIT 1;
  
  IF produto_teste IS NOT NULL THEN
    -- Gerar número de pedido único
    numero_pedido_teste := 'TESTE-ESTOQUE-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    RAISE NOTICE '=== INICIANDO TESTE DE VENDA ===';
    RAISE NOTICE 'Produto: %', produto_teste;
    RAISE NOTICE 'Estoque antes: %', estoque_antes;
    RAISE NOTICE 'Movimentações antes: %', movimentacoes_antes;
    
    -- Criar pedido de teste
    INSERT INTO public.pedidos (
      numero_pedido,
      cliente_id,
      subtotal,
      frete,
      total,
      status,
      forma_pagamento
    ) VALUES (
      numero_pedido_teste,
      NULL,
      75.00,
      10.00,
      85.00,
      'confirmado',
      'teste_automatico'
    ) RETURNING id INTO pedido_teste;
    
    RAISE NOTICE 'Pedido criado: %', pedido_teste;
    
    -- Inserir item do pedido (ISSO DEVE DISPARAR O TRIGGER!)
    INSERT INTO public.itens_pedido (
      pedido_id,
      produto_id,
      nome,
      quantidade,
      preco_unitario,
      subtotal
    ) VALUES (
      pedido_teste,
      produto_teste::TEXT,
      'Produto Teste Automático',
      3, -- Vender 3 unidades
      25.00,
      75.00
    );
    
    RAISE NOTICE 'Item do pedido inserido - 3 unidades';
    
    -- Aguardar um momento para os triggers processarem
    PERFORM pg_sleep(1);
    
    -- Verificar estoque depois
    SELECT estoque INTO estoque_depois 
    FROM public.produtos 
    WHERE id = produto_teste;
    
    -- Contar movimentações depois
    SELECT COUNT(*) INTO movimentacoes_depois 
    FROM public.movimentacoes_estoque;
    
    RAISE NOTICE '=== RESULTADOS DO TESTE ===';
    RAISE NOTICE 'Estoque depois: %', estoque_depois;
    RAISE NOTICE 'Diferença no estoque: %', (estoque_antes - estoque_depois);
    RAISE NOTICE 'Movimentações depois: %', movimentacoes_depois;
    RAISE NOTICE 'Novas movimentações: %', (movimentacoes_depois - movimentacoes_antes);
    
    -- Verificações de sucesso
    IF (estoque_antes - estoque_depois) = 3 THEN
      RAISE NOTICE '✅ SUCCESS: Estoque diminuiu corretamente (3 unidades)!';
    ELSE
      RAISE NOTICE '❌ ERROR: Estoque não diminuiu corretamente!';
    END IF;
    
    IF (movimentacoes_depois - movimentacoes_antes) >= 1 THEN
      RAISE NOTICE '✅ SUCCESS: Movimentação de estoque foi registrada!';
    ELSE
      RAISE NOTICE '❌ ERROR: Movimentação de estoque NÃO foi registrada!';
    END IF;
    
    -- Verificar se a movimentação específica foi criada
    IF EXISTS (
      SELECT 1 FROM public.movimentacoes_estoque 
      WHERE produto_id = produto_teste 
      AND tipo = 'saida' 
      AND motivo = 'Venda realizada'
      AND observacoes LIKE '%' || numero_pedido_teste || '%'
      AND created_at > NOW() - INTERVAL '2 minutes'
    ) THEN
      RAISE NOTICE '✅ SUCCESS: Movimentação específica encontrada!';
    ELSE
      RAISE NOTICE '❌ ERROR: Movimentação específica NÃO encontrada!';
    END IF;
    
  ELSE
    RAISE NOTICE '❌ ERROR: Nenhum produto disponível para teste (precisa ter estoque > 5)';
  END IF;
END $$;

-- 4. Verificar últimas movimentações criadas
SELECT 
  m.created_at,
  m.tipo,
  m.quantidade,
  m.valor_unitario,
  m.motivo,
  m.observacoes,
  p.nome as produto_nome,
  p.estoque as estoque_atual
FROM public.movimentacoes_estoque m
JOIN public.produtos p ON p.id = m.produto_id
WHERE m.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY m.created_at DESC
LIMIT 5;

-- 5. Verificar últimos pedidos criados
SELECT 
  p.numero_pedido,
  p.status,
  p.total,
  p.created_at,
  COUNT(ip.id) as total_itens
FROM public.pedidos p
LEFT JOIN public.itens_pedido ip ON ip.pedido_id = p.id
WHERE p.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY p.id, p.numero_pedido, p.status, p.total, p.created_at
ORDER BY p.created_at DESC;

-- 6. TESTE DE CANCELAMENTO (OPCIONAL)
-- Descomente para testar a reversão de estoque
/*
DO $$
DECLARE
  pedido_para_cancelar UUID;
BEGIN
  -- Pegar o último pedido de teste
  SELECT id INTO pedido_para_cancelar
  FROM public.pedidos 
  WHERE numero_pedido LIKE 'TESTE-ESTOQUE-%'
  AND status != 'cancelado'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF pedido_para_cancelar IS NOT NULL THEN
    RAISE NOTICE '=== TESTANDO CANCELAMENTO ===';
    RAISE NOTICE 'Cancelando pedido: %', pedido_para_cancelar;
    
    -- Cancelar o pedido (deve disparar trigger de reversão)
    UPDATE public.pedidos 
    SET status = 'cancelado'
    WHERE id = pedido_para_cancelar;
    
    RAISE NOTICE '✅ Pedido cancelado - verifique se o estoque foi revertido';
  END IF;
END $$;
*/

-- =====================================================
-- RESULTADO ESPERADO:
-- ✅ Triggers ativos
-- ✅ Estoque diminui automaticamente na venda
-- ✅ Movimentação registrada automaticamente
-- ✅ Cancelamento reverte o estoque (se testado)
-- =====================================================