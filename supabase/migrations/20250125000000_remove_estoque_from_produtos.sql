-- =====================================================
-- MIGRAÇÃO: REMOVER CAMPO ESTOQUE DA TABELA PRODUTOS
-- =====================================================
-- Esta migração corrige a duplicação de campos de estoque
-- removendo o campo 'estoque' da tabela 'produtos' e
-- transferindo o controle de estoque apenas para as variações
-- =====================================================

BEGIN;

-- 1. Primeiro, verificar se existem dados no campo estoque da tabela produtos
-- Se houver dados, precisamos transferi-los para as variações correspondentes
DO $$
DECLARE
    produto_record RECORD;
    variante_record RECORD;
    total_estoque INTEGER;
BEGIN
    -- Verificar se há produtos com estoque > 0
    IF EXISTS (
        SELECT 1 FROM public.produtos 
        WHERE estoque > 0 
        AND id IN (SELECT DISTINCT produto_id FROM public.variantes_produto)
    ) THEN
        
        RAISE NOTICE 'Transferindo estoque de produtos para suas variações...';
        
        -- Para cada produto com estoque e variações
        FOR produto_record IN 
            SELECT id, estoque, nome 
            FROM public.produtos 
            WHERE estoque > 0 
            AND id IN (SELECT DISTINCT produto_id FROM public.variantes_produto)
        LOOP
            -- Verificar se o produto tem variações
            IF EXISTS (SELECT 1 FROM public.variantes_produto WHERE produto_id = produto_record.id) THEN
                
                -- Distribuir o estoque igualmente entre as variações ativas
                UPDATE public.variantes_produto
                SET estoque = GREATEST(1, (produto_record.estoque / 
                    (SELECT COUNT(*) FROM public.variantes_produto 
                     WHERE produto_id = produto_record.id AND ativo = true)))
                WHERE produto_id = produto_record.id
                AND ativo = true;
                
                RAISE NOTICE 'Produto %: Transferido estoque % para variações', produto_record.nome, produto_record.estoque;
                
            END IF;
        END LOOP;
        
    END IF;
    
    -- Para produtos sem variações, manteremos o estoque temporariamente
    -- mas adicionaremos uma variação padrão
    FOR produto_record IN 
        SELECT id, estoque, nome 
        FROM public.produtos 
        WHERE estoque > 0 
        AND id NOT IN (SELECT DISTINCT produto_id FROM public.variantes_produto)
    LOOP
        
        -- Criar uma variação padrão para produtos sem variações
        INSERT INTO public.variantes_produto (
            produto_id, cor, tamanho, estoque, ativo, sku
        ) VALUES (
            produto_record.id,
            'Padrão',
            'Único',
            produto_record.estoque,
            true,
            'DEFAULT-' || produto_record.id
        );
        
        RAISE NOTICE 'Produto %: Criada variação padrão com estoque %', produto_record.nome, produto_record.estoque;
        
    END LOOP;
    
END $$;

-- 2. Atualizar funções que dependem do campo estoque em produtos
-- Primeiro, precisamos ajustar a função atualizar_estoque_produto
-- para trabalhar apenas com variações
DO $$
BEGIN
    -- Verificar se a função existe e dropar se necessário
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'atualizar_estoque_produto'
    ) THEN
        DROP FUNCTION atualizar_estoque_produto();
    END IF;
END $$;

-- 3. Remover o campo estoque da tabela produtos
-- Primeiro, remover quaisquer constraints ou dependências
ALTER TABLE public.produtos 
DROP COLUMN IF EXISTS estoque,
DROP COLUMN IF EXISTS estoque_minimo;

-- 4. Atualizar a view vw_vendas_estoque para usar variações em vez de produtos
DROP VIEW IF EXISTS vw_vendas_estoque;

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
    COALESCE((SELECT SUM(estoque) FROM public.variantes_produto vp WHERE vp.produto_id = ip.produto_id::UUID), 0) as estoque_atual,
    m.id as movimentacao_id,
    m.created_at as data_movimentacao
FROM public.pedidos p
JOIN public.itens_pedido ip ON ip.pedido_id = p.id
JOIN public.produtos pr ON pr.id = ip.produto_id::UUID
LEFT JOIN public.movimentacoes_estoque m ON m.produto_id = ip.produto_id::UUID 
    AND m.observacoes LIKE '%Pedido: ' || p.numero_pedido || '%'
ORDER BY p.created_at DESC;

-- 5. Atualizar a função produtos_estoque_baixo para usar variações
DROP FUNCTION IF EXISTS produtos_estoque_baixo(INTEGER);

CREATE OR REPLACE FUNCTION produtos_estoque_baixo(limite_minimo INTEGER DEFAULT 10)
RETURNS TABLE (
    produto_id UUID,
    nome TEXT,
    estoque_atual INTEGER,
    ultima_venda TIMESTAMPTZ,
    total_vendas_mes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        COALESCE(SUM(vp.estoque), 0) as estoque_atual,
        MAX(ped.created_at) as ultima_venda,
        COUNT(ip.id)::INTEGER as vendas_mes
    FROM public.produtos p
    LEFT JOIN public.variantes_produto vp ON vp.produto_id = p.id
    LEFT JOIN public.itens_pedido ip ON ip.produto_id = p.id::TEXT
    LEFT JOIN public.pedidos ped ON ped.id = ip.pedido_id 
        AND ped.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND ped.status != 'cancelado'
    GROUP BY p.id, p.nome
    HAVING COALESCE(SUM(vp.estoque), 0) <= limite_minimo
    ORDER BY estoque_atual ASC, vendas_mes DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Atualizar triggers para não depender mais do campo estoque em produtos
-- Os triggers de movimentações de estoque já funcionam com variantes

-- 7. Adicionar comentários para documentação
COMMENT ON COLUMN public.variantes_produto.estoque IS 'Quantidade em estoque desta variação. O estoque total do produto é a soma de todas as variações ativas.';
COMMENT ON COLUMN public.produtos.ativo IS 'Indica se o produto está ativo. Produtos inativos não aparecem no catálogo.';

-- 8. Criar índice para melhor performance nas consultas de estoque
CREATE INDEX IF NOT EXISTS idx_variantes_produto_estoque 
ON public.variantes_produto(estoque) 
WHERE estoque > 0 AND ativo = true;

CREATE INDEX IF NOT EXISTS idx_variantes_produto_produto_id_estoque 
ON public.variantes_produto(produto_id, estoque) 
WHERE ativo = true;

-- =====================================================
-- VALIDAÇÃO DA MIGRAÇÃO
-- =====================================================

-- Verificar se a migração foi aplicada com sucesso
DO $$
BEGIN
    -- Verificar se o campo estoque foi removido da tabela produtos
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'produtos' 
        AND column_name = 'estoque'
    ) THEN
        RAISE EXCEPTION 'Falha na migração: campo estoque ainda existe na tabela produtos';
    END IF;
    
    -- Verificar se as variações têm estoque
    IF NOT EXISTS (
        SELECT 1 FROM public.variantes_produto 
        WHERE estoque > 0
        LIMIT 1
    ) THEN
        RAISE WARNING 'Nenhuma variação com estoque positivo encontrada. Verifique a transferência de dados.';
    END IF;
    
    RAISE NOTICE 'Migração aplicada com sucesso! Estoque agora é controlado apenas nas variações.';
END $$;

COMMIT;

-- =====================================================
-- INSTRUÇÕES PÓS-MIGRAÇÃO
-- =====================================================

-- 1. Testar a função de estoque baixo:
-- SELECT * FROM produtos_estoque_baixo(5);

-- 2. Verificar o relatório de vendas e estoque:
-- SELECT * FROM vw_vendas_estoque LIMIT 10;

-- 3. Testar a criação de uma nova variação:
-- INSERT INTO public.variantes_produto (produto_id, cor, tamanho, estoque, ativo)
-- VALUES ((SELECT id FROM public.produtos LIMIT 1), 'Azul', 'M', 10, true);

-- 4. Monitorar o sistema por alguns dias para garantir que
--    todas as funcionalidades de estoque continuem funcionando