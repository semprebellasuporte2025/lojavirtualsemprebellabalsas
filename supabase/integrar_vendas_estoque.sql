-- =====================================================
-- INTEGRAÇÃO AUTOMÁTICA ENTRE VENDAS E ESTOQUE
-- Execute este script após criar a tabela de movimentações
-- =====================================================

-- 1. Função para registrar movimentação de estoque quando itens são vendidos
CREATE OR REPLACE FUNCTION registrar_venda_estoque()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar movimentação de saída para cada item vendido
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
    NEW.produto_id::UUID,
    'saida',
    NEW.quantidade * -1, -- Quantidade negativa para saída
    NEW.preco_unitario,
    NEW.subtotal * -1, -- Valor negativo para saída
    'Venda realizada',
    'Venda automática - Pedido: ' || (
      SELECT numero_pedido 
      FROM public.pedidos 
      WHERE id = NEW.pedido_id
    ),
    'Sistema - Venda Automática'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para executar a função quando um item é inserido na tabela itens_pedido
DROP TRIGGER IF EXISTS trigger_registrar_venda_estoque ON public.itens_pedido;
CREATE TRIGGER trigger_registrar_venda_estoque
  AFTER INSERT ON public.itens_pedido
  FOR EACH ROW EXECUTE FUNCTION registrar_venda_estoque();

-- 3. Função para reverter estoque quando um pedido é cancelado
CREATE OR REPLACE FUNCTION reverter_estoque_cancelamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processa se o status mudou para 'cancelado'
  IF OLD.status != 'cancelado' AND NEW.status = 'cancelado' THEN
    -- Para cada item do pedido cancelado, criar movimentação de entrada (reversão)
    INSERT INTO public.movimentacoes_estoque (
      produto_id,
      tipo,
      quantidade,
      valor_unitario,
      valor_total,
      motivo,
      observacoes,
      usuario_nome
    )
    SELECT 
      ip.produto_id::UUID,
      'entrada',
      ip.quantidade, -- Quantidade positiva para entrada (reversão)
      ip.preco_unitario,
      ip.subtotal,
      'Cancelamento de venda',
      'Reversão automática - Pedido cancelado: ' || NEW.numero_pedido,
      'Sistema - Cancelamento Automático'
    FROM public.itens_pedido ip
    WHERE ip.pedido_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para reverter estoque quando pedido é cancelado
DROP TRIGGER IF EXISTS trigger_reverter_estoque_cancelamento ON public.pedidos;
CREATE TRIGGER trigger_reverter_estoque_cancelamento
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION reverter_estoque_cancelamento();

-- 5. Função para consultar histórico de movimentações por produto
CREATE OR REPLACE FUNCTION obter_historico_estoque_produto(produto_uuid UUID)
RETURNS TABLE (
  data_movimentacao TIMESTAMPTZ,
  tipo TEXT,
  quantidade INTEGER,
  valor_unitario NUMERIC,
  motivo TEXT,
  observacoes TEXT,
  usuario_nome TEXT,
  estoque_atual INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.created_at,
    m.tipo,
    m.quantidade,
    m.valor_unitario,
    m.motivo,
    m.observacoes,
    m.usuario_nome,
    p.estoque
  FROM public.movimentacoes_estoque m
  JOIN public.produtos p ON p.id = m.produto_id
  WHERE m.produto_id = produto_uuid
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. View para relatório de vendas com impacto no estoque
CREATE OR REPLACE VIEW vw_vendas_estoque AS
SELECT 
  p.numero_pedido,
  p.created_at as data_venda,
  p.status,
  p.total as valor_venda,
  ip.produto_id,
  pr.nome as produto_nome,
  ip.quantidade as qtd_vendida,
  ip.preco_unitario,
  ip.subtotal,
  pr.estoque as estoque_atual,
  m.id as movimentacao_id,
  m.created_at as data_movimentacao
FROM public.pedidos p
JOIN public.itens_pedido ip ON ip.pedido_id = p.id
JOIN public.produtos pr ON pr.id = ip.produto_id::UUID
LEFT JOIN public.movimentacoes_estoque m ON m.produto_id = ip.produto_id::UUID 
  AND m.observacoes LIKE '%Pedido: ' || p.numero_pedido || '%'
ORDER BY p.created_at DESC;

-- 7. Função para verificar produtos com estoque baixo
CREATE OR REPLACE FUNCTION produtos_estoque_baixo(limite_minimo INTEGER DEFAULT 10)
RETURNS TABLE (
  produto_id UUID,
  nome VARCHAR(255),
  estoque_atual INTEGER,
  ultima_venda TIMESTAMPTZ,
  total_vendas_mes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.estoque,
    MAX(ped.created_at) as ultima_venda,
    COUNT(ip.id)::INTEGER as vendas_mes
  FROM public.produtos p
  LEFT JOIN public.itens_pedido ip ON ip.produto_id = p.id::TEXT
  LEFT JOIN public.pedidos ped ON ped.id = ip.pedido_id 
    AND ped.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND ped.status != 'cancelado'
  WHERE p.estoque <= limite_minimo
  GROUP BY p.id, p.nome, p.estoque
  ORDER BY p.estoque ASC, vendas_mes DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TESTES E VERIFICAÇÕES
-- =====================================================

-- Teste 1: Verificar se os triggers foram criados
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

-- Teste 2: Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'registrar_venda_estoque',
  'reverter_estoque_cancelamento',
  'obter_historico_estoque_produto',
  'produtos_estoque_baixo'
)
ORDER BY routine_name;

-- Teste 3: Verificar se a view foi criada
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'vw_vendas_estoque';

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

-- Para consultar histórico de um produto:
-- SELECT * FROM obter_historico_estoque_produto('uuid-do-produto');

-- Para ver produtos com estoque baixo:
-- SELECT * FROM produtos_estoque_baixo(5); -- produtos com 5 ou menos itens

-- Para ver relatório de vendas e estoque:
-- SELECT * FROM vw_vendas_estoque WHERE data_venda >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- INTEGRAÇÃO CONCLUÍDA!
-- 
-- Agora quando uma venda for realizada:
-- 1. O estoque será automaticamente diminuído
-- 2. Uma movimentação de saída será registrada
-- 3. Se o pedido for cancelado, o estoque será revertido
-- 4. Você pode consultar relatórios e histórico
-- =====================================================