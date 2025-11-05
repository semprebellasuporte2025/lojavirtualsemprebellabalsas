-- =====================================================
-- SCRIPT DE TESTE DA INTEGRAÇÃO VENDAS-ESTOQUE
-- Execute após rodar o script de integração
-- =====================================================

-- 1. Verificar se os triggers estão ativos
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_registrar_venda_estoque',
  'trigger_reverter_estoque_cancelamento'
)
ORDER BY trigger_name;

-- 2. Verificar estoque atual de alguns produtos
SELECT 
  id,
  nome,
  preco,
  estoque,
  created_at
FROM public.produtos 
WHERE estoque IS NOT NULL
ORDER BY estoque DESC
LIMIT 10;

-- 3. Verificar últimas movimentações de estoque
SELECT 
  m.created_at,
  m.tipo,
  m.quantidade,
  m.valor_unitario,
  m.motivo,
  m.observacoes,
  m.usuario_nome,
  p.nome as produto_nome
FROM public.movimentacoes_estoque m
JOIN public.produtos p ON p.id = m.produto_id
ORDER BY m.created_at DESC
LIMIT 10;

-- 4. Verificar últimos pedidos e seus itens
SELECT 
  ped.numero_pedido,
  ped.status,
  ped.total,
  ped.created_at,
  ip.produto_id,
  ip.nome as produto_nome,
  ip.quantidade,
  ip.preco_unitario,
  ip.subtotal
FROM public.pedidos ped
JOIN public.itens_pedido ip ON ip.pedido_id = ped.id
ORDER BY ped.created_at DESC
LIMIT 10;

-- 5. Verificar se há movimentações automáticas de vendas
SELECT 
  COUNT(*) as total_movimentacoes_venda,
  SUM(CASE WHEN tipo = 'saida' THEN 1 ELSE 0 END) as saidas_automaticas,
  SUM(CASE WHEN motivo = 'Venda realizada' THEN 1 ELSE 0 END) as vendas_registradas
FROM public.movimentacoes_estoque
WHERE observacoes LIKE '%Venda automática%' OR motivo = 'Venda realizada';

-- 6. Relatório de vendas com impacto no estoque (últimos 30 dias)
SELECT * FROM vw_vendas_estoque 
WHERE data_venda >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY data_venda DESC
LIMIT 20;

-- 7. Produtos com estoque baixo (menos de 10 itens)
SELECT * FROM produtos_estoque_baixo(10);

-- 8. Teste de simulação (CUIDADO: só execute se quiser testar)
-- Este bloco simula uma venda para testar a integração
-- DESCOMENTE APENAS SE QUISER FAZER UM TESTE REAL

/*
DO $$
DECLARE
  produto_teste UUID;
  pedido_teste UUID;
  estoque_antes INTEGER;
  estoque_depois INTEGER;
BEGIN
  -- Pegar um produto para teste
  SELECT id INTO produto_teste 
  FROM public.produtos 
  WHERE estoque > 0 
  LIMIT 1;
  
  IF produto_teste IS NOT NULL THEN
    -- Verificar estoque antes
    SELECT estoque INTO estoque_antes 
    FROM public.produtos 
    WHERE id = produto_teste;
    
    RAISE NOTICE 'Produto teste: %, Estoque antes: %', produto_teste, estoque_antes;
    
    -- Criar um pedido de teste
    INSERT INTO public.pedidos (
      numero_pedido,
      cliente_id,
      subtotal,
      frete,
      total,
      status,
      forma_pagamento
    ) VALUES (
      'TESTE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
      NULL,
      50.00,
      0,
      50.00,
      'pendente',
      'teste'
    ) RETURNING id INTO pedido_teste;
    
    -- Inserir item do pedido (isso deve disparar o trigger)
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
      'Produto Teste',
      2,
      25.00,
      50.00
    );
    
    -- Verificar estoque depois
    SELECT estoque INTO estoque_depois 
    FROM public.produtos 
    WHERE id = produto_teste;
    
    RAISE NOTICE 'Estoque depois: %', estoque_depois;
    RAISE NOTICE 'Diferença: %', (estoque_antes - estoque_depois);
    
    -- Verificar se foi criada a movimentação
    IF EXISTS (
      SELECT 1 FROM public.movimentacoes_estoque 
      WHERE produto_id = produto_teste 
      AND tipo = 'saida' 
      AND motivo = 'Venda realizada'
      AND created_at > NOW() - INTERVAL '1 minute'
    ) THEN
      RAISE NOTICE 'SUCCESS: Movimentação de estoque foi criada automaticamente!';
    ELSE
      RAISE NOTICE 'ERROR: Movimentação de estoque NÃO foi criada!';
    END IF;
    
  ELSE
    RAISE NOTICE 'Nenhum produto disponível para teste';
  END IF;
END $$;
*/

-- =====================================================
-- CONSULTAS ÚTEIS PARA MONITORAMENTO
-- =====================================================

-- Consulta 1: Produtos mais vendidos no mês
SELECT 
  p.nome,
  SUM(ip.quantidade) as total_vendido,
  p.estoque as estoque_atual,
  COUNT(DISTINCT ped.id) as num_pedidos
FROM public.produtos p
JOIN public.itens_pedido ip ON ip.produto_id = p.id::TEXT
JOIN public.pedidos ped ON ped.id = ip.pedido_id
WHERE ped.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND ped.status != 'cancelado'
GROUP BY p.id, p.nome, p.estoque
ORDER BY total_vendido DESC
LIMIT 10;

-- Consulta 2: Movimentações de estoque por tipo (últimos 7 dias)
SELECT 
  tipo,
  COUNT(*) as quantidade_movimentacoes,
  SUM(ABS(quantidade)) as total_itens_movimentados,
  SUM(ABS(valor_total)) as valor_total_movimentado
FROM public.movimentacoes_estoque
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY tipo
ORDER BY quantidade_movimentacoes DESC;

-- Consulta 3: Alertas de estoque crítico
SELECT 
  p.nome,
  p.estoque,
  COALESCE(vendas_mes.total_vendido, 0) as vendido_mes,
  CASE 
    WHEN p.estoque = 0 THEN 'SEM ESTOQUE'
    WHEN p.estoque <= 5 THEN 'CRÍTICO'
    WHEN p.estoque <= 10 THEN 'BAIXO'
    ELSE 'OK'
  END as status_estoque
FROM public.produtos p
LEFT JOIN (
  SELECT 
    ip.produto_id,
    SUM(ip.quantidade) as total_vendido
  FROM public.itens_pedido ip
  JOIN public.pedidos ped ON ped.id = ip.pedido_id
  WHERE ped.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND ped.status != 'cancelado'
  GROUP BY ip.produto_id
) vendas_mes ON vendas_mes.produto_id = p.id::TEXT
WHERE p.estoque <= 10
ORDER BY p.estoque ASC, vendido_mes DESC;

-- =====================================================
-- RESULTADO ESPERADO:
-- 
-- ✅ Triggers criados e ativos
-- ✅ Movimentações automáticas sendo registradas
-- ✅ Estoque sendo atualizado nas vendas
-- ✅ Relatórios funcionando
-- ✅ Produtos com estoque baixo identificados
-- =====================================================