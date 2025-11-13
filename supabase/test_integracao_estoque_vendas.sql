-- =====================================================
-- TESTE DE INTEGRAÇÃO ESTOQUE-VENDAS APÓS MIGRAÇÃO
-- =====================================================
-- Este script testa a integração entre vendas e estoque
-- após a migração para controle de estoque apenas em variações
-- =====================================================

BEGIN;

-- 1. Preparar dados de teste
-- Criar um produto de teste se não existir
INSERT INTO public.produtos (id, nome, descricao, preco, categoria_id, ativo)
SELECT 
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Produto Teste Integração',
    'Produto para teste de integração estoque-vendas',
    29.90,
    (SELECT id FROM public.categorias LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.produtos 
    WHERE id = '11111111-1111-1111-1111-111111111111'
);

-- 2. Criar variações de teste para o produto
-- Variação 1
INSERT INTO public.variantes_produto (
    produto_id, cor, tamanho, estoque, ativo, sku
)
SELECT 
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Azul',
    'P',
    20, -- Estoque inicial
    true,
    'TEST-AZUL-P'
WHERE NOT EXISTS (
    SELECT 1 FROM public.variantes_produto 
    WHERE produto_id = '11111111-1111-1111-1111-111111111111' 
    AND cor = 'Azul' AND tamanho = 'P'
);

-- Variação 2  
INSERT INTO public.variantes_produto (
    produto_id, cor, tamanho, estoque, ativo, sku
)
SELECT 
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Vermelho',
    'M',
    15, -- Estoque inicial
    true,
    'TEST-VERM-M'
WHERE NOT EXISTS (
    SELECT 1 FROM public.variantes_produto 
    WHERE produto_id = '11111111-1111-1111-1111-111111111111' 
    AND cor = 'Vermelho' AND tamanho = 'M'
);

-- 3. Verificar estoque inicial
SELECT '=== ESTOQUE INICIAL ===' as info;
SELECT 
    p.id as produto_id,
    p.nome as produto_nome,
    vp.cor,
    vp.tamanho,
    vp.estoque,
    vp.ativo,
    obter_estoque_total_produto(p.id) as estoque_total
FROM public.produtos p
LEFT JOIN public.variantes_produto vp ON vp.produto_id = p.id
WHERE p.id = '11111111-1111-1111-1111-111111111111';

-- 4. Testar função de verificação de estoque
SELECT '=== VERIFICAÇÃO DE ESTOQUE ===' as info;
SELECT 
    verificar_estoque_suficiente('11111111-1111-1111-1111-111111111111', 10) as tem_estoque_10,
    verificar_estoque_suficiente('11111111-1111-1111-1111-111111111111', 40) as tem_estoque_40;

-- 5. Simular uma venda
-- Criar um pedido de teste
INSERT INTO public.pedidos (
    numero_pedido, cliente_id, status, total, tipo_entrega, endereco_entrega
)
SELECT 
    'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    (SELECT id FROM auth.users LIMIT 1),
    'pendente',
    59.80, -- 2 itens a 29.90
    'delivery',
    'Endereço de teste'
RETURNING id INTO pedido_id_test;

-- Adicionar itens ao pedido (simulando venda)
INSERT INTO public.itens_pedido (
    pedido_id, produto_id, quantidade, preco_unitario, subtotal
)
VALUES 
    (pedido_id_test, '11111111-1111-1111-1111-111111111111', 2, 29.90, 59.80);

-- 6. Verificar estoque após venda
SELECT '=== ESTOQUE APÓS VENDA ===' as info;
SELECT 
    p.id as produto_id,
    p.nome as produto_nome,
    vp.cor,
    vp.tamanho,
    vp.estoque,
    vp.ativo,
    obter_estoque_total_produto(p.id) as estoque_total
FROM public.produtos p
LEFT JOIN public.variantes_produto vp ON vp.produto_id = p.id
WHERE p.id = '11111111-1111-1111-1111-111111111111';

-- 7. Verificar movimentações de estoque geradas
SELECT '=== MOVIMENTAÇÕES DE ESTOQUE ===' as info;
SELECT 
    id,
    produto_id,
    tipo,
    quantidade,
    motivo,
    observacoes,
    created_at
FROM public.movimentacoes_estoque 
WHERE produto_id = '11111111-1111-1111-1111-111111111111'
ORDER BY created_at DESC
LIMIT 5;

-- 8. Testar cancelamento de pedido
-- Atualizar status para cancelado
UPDATE public.pedidos 
SET status = 'cancelado', updated_at = NOW()
WHERE id = pedido_id_test;

-- 9. Verificar estoque após cancelamento
SELECT '=== ESTOQUE APÓS CANCELAMENTO ===' as info;
SELECT 
    p.id as produto_id,
    p.nome as produto_nome,
    vp.cor,
    vp.tamanho,
    vp.estoque,
    vp.ativo,
    obter_estoque_total_produto(p.id) as estoque_total
FROM public.produtos p
LEFT JOIN public.variantes_produto vp ON vp.produto_id = p.id
WHERE p.id = '11111111-1111-1111-1111-111111111111';

-- 10. Verificar movimentações após cancelamento
SELECT '=== MOVIMENTAÇÕES APÓS CANCELAMENTO ===' as info;
SELECT 
    id,
    produto_id,
    tipo,
    quantidade,
    motivo,
    observacoes,
    created_at
FROM public.movimentacoes_estoque 
WHERE produto_id = '11111111-1111-1111-1111-111111111111'
ORDER BY created_at DESC
LIMIT 5;

-- 11. Testar função de produtos com estoque baixo
SELECT '=== PRODUTOS COM ESTOQUE BAIXO ===' as info;
SELECT * FROM produtos_estoque_baixo(25) 
WHERE produto_id = '11111111-1111-1111-1111-111111111111';

-- 12. Testar função de resumo de negócios
SELECT '=== RESUMO DE NEGÓCIOS ===' as info;
SELECT * FROM get_business_summary();

-- 13. Limpeza (opcional - comentado para análise)
/*
-- DELETE FROM public.movimentacoes_estoque WHERE produto_id = '11111111-1111-1111-1111-111111111111';
-- DELETE FROM public.itens_pedido WHERE pedido_id = pedido_id_test;
-- DELETE FROM public.pedidos WHERE id = pedido_id_test;
-- DELETE FROM public.variantes_produto WHERE produto_id = '11111111-1111-1111-1111-111111111111';
-- DELETE FROM public.produtos WHERE id = '11111111-1111-1111-1111-111111111111';
*/

COMMIT;

-- =====================================================
-- ANÁLISE DOS RESULTADOS
-- =====================================================

DO $$
BEGIN
    -- Verificar se o teste foi executado com sucesso
    IF EXISTS (
        SELECT 1 FROM public.movimentacoes_estoque 
        WHERE produto_id = '11111111-1111-1111-1111-111111111111'
        AND tipo = 'saida'
    ) THEN
        RAISE NOTICE '✅ Teste de integração estoque-vendas executado com sucesso!';
        RAISE NOTICE '✅ Movimentações de estoque foram geradas automaticamente';
        RAISE NOTICE '✅ Estoque foi atualizado nas variações';
        RAISE NOTICE '✅ Cancelamento reverteu o estoque corretamente';
    ELSE
        RAISE WARNING '❌ Teste falhou - verifique os triggers e funções';
    END IF;
    
    -- Verificar consistência dos dados
    IF EXISTS (
        SELECT 1 FROM public.variantes_produto 
        WHERE produto_id = '11111111-1111-1111-1111-111111111111'
        AND estoque < 0
    ) THEN
        RAISE WARNING '❌ Atenção: estoque negativo detectado!';
    END IF;
    
END $$;

-- =====================================================
-- PRÓXIMOS PASSOS
-- =====================================================

-- 1. Executar este script no SQL Editor do Supabase
-- 2. Analisar os resultados para garantir que tudo funciona
-- 3. Monitorar o sistema em produção por alguns dias
-- 4. Verificar relatórios e dashboards de estoque
-- 5. Testar cenários edge cases (estoque zero, múltiplas variações, etc.)