-- =====================================================
-- ATUALIZAÇÃO DAS FUNÇÕES DE ESTOQUE PARA TRABALHAR COM VARIAÇÕES
-- =====================================================
-- Este script atualiza todas as funções relacionadas ao estoque
-- para trabalhar exclusivamente com a tabela variantes_produto
-- após a remoção do campo estoque da tabela produtos
-- =====================================================

BEGIN;

-- 1. Função para atualizar estoque automaticamente baseado em movimentações
-- Esta função agora atualiza o estoque nas variações em vez do produto
CREATE OR REPLACE FUNCTION atualizar_estoque_variante()
RETURNS TRIGGER AS $$
DECLARE
    variante_id UUID;
    variante_estoque INTEGER;
BEGIN
    -- Determinar qual variação deve ser atualizada
    -- Para simplificação, vamos usar a primeira variação ativa do produto
    -- Em um sistema real, você precisaria de lógica mais sofisticada
    SELECT id, estoque INTO variante_id, variante_estoque
    FROM public.variantes_produto 
    WHERE produto_id = NEW.produto_id 
    AND ativo = true
    ORDER BY created_at
    LIMIT 1;
    
    -- Se não encontrar variação ativa, criar uma padrão
    IF variante_id IS NULL THEN
        INSERT INTO public.variantes_produto (
            produto_id, cor, tamanho, estoque, ativo, sku
        ) VALUES (
            NEW.produto_id,
            'Padrão',
            'Único',
            0,
            true,
            'DEFAULT-' || NEW.produto_id
        ) RETURNING id INTO variante_id;
    END IF;
    
    -- Para entrada: somar ao estoque da variação
    IF NEW.tipo = 'entrada' THEN
        UPDATE public.variantes_produto 
        SET estoque = COALESCE(estoque, 0) + NEW.quantidade,
            updated_at = NOW()
        WHERE id = variante_id;
    
    -- Para saída: subtrair do estoque da variação
    ELSIF NEW.tipo = 'saida' THEN
        UPDATE public.variantes_produto 
        SET estoque = GREATEST(0, COALESCE(estoque, 0) - NEW.quantidade),
            updated_at = NOW()
        WHERE id = variante_id;
    
    -- Para ajuste: aplicar a quantidade (pode ser positiva ou negativa)
    ELSIF NEW.tipo = 'ajuste' THEN
        UPDATE public.variantes_produto 
        SET estoque = GREATEST(0, COALESCE(estoque, 0) + NEW.quantidade),
            updated_at = NOW()
        WHERE id = variante_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar o trigger para usar a nova função
DROP TRIGGER IF EXISTS trigger_atualizar_estoque_produto ON public.movimentacoes_estoque;
DROP TRIGGER IF EXISTS trigger_atualizar_estoque_variante ON public.movimentacoes_estoque;

CREATE TRIGGER trigger_atualizar_estoque_variante
  AFTER INSERT ON public.movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_variante();

-- 3. Função para obter o estoque total de um produto (soma de todas as variações)
CREATE OR REPLACE FUNCTION obter_estoque_total_produto(produto_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(estoque) 
         FROM public.variantes_produto 
         WHERE produto_id = produto_uuid 
         AND ativo = true),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Função para verificar se há estoque suficiente para uma venda
CREATE OR REPLACE FUNCTION verificar_estoque_suficiente(
    produto_uuid UUID,
    quantidade_requerida INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    estoque_total INTEGER;
BEGIN
    SELECT obter_estoque_total_produto(produto_uuid) INTO estoque_total;
    RETURN estoque_total >= quantidade_requerida;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para registrar venda e atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION registrar_venda_atualizar_estoque()
RETURNS TRIGGER AS $$
DECLARE
    variante_id UUID;
    variante_estoque INTEGER;
BEGIN
    -- Encontrar a variação apropriada para o produto
    SELECT id, estoque INTO variante_id, variante_estoque
    FROM public.variantes_produto 
    WHERE produto_id = NEW.produto_id::UUID
    AND ativo = true
    ORDER BY estoque DESC
    LIMIT 1;
    
    -- Se não encontrar variação, criar uma padrão
    IF variante_id IS NULL THEN
        INSERT INTO public.variantes_produto (
            produto_id, cor, tamanho, estoque, ativo, sku
        ) VALUES (
            NEW.produto_id::UUID,
            'Padrão',
            'Único',
            0,
            true,
            'DEFAULT-' || NEW.produto_id
        ) RETURNING id INTO variante_id;
    END IF;
    
    -- Atualizar o estoque da variação
    UPDATE public.variantes_produto 
    SET estoque = GREATEST(0, COALESCE(estoque, 0) - NEW.quantidade),
        updated_at = NOW()
    WHERE id = variante_id;
    
    -- Registrar a movimentação de estoque
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
        NEW.quantidade * -1,
        NEW.preco_unitario,
        NEW.subtotal * -1,
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

-- 6. Atualizar trigger de vendas para usar a nova função
DROP TRIGGER IF EXISTS trigger_registrar_venda_estoque ON public.itens_pedido;
DROP TRIGGER IF EXISTS trigger_registrar_venda_atualizar_estoque ON public.itens_pedido;

CREATE TRIGGER trigger_registrar_venda_atualizar_estoque
  AFTER INSERT ON public.itens_pedido
  FOR EACH ROW EXECUTE FUNCTION registrar_venda_atualizar_estoque();

-- 7. Função para reverter estoque quando um pedido é cancelado
CREATE OR REPLACE FUNCTION reverter_estoque_cancelamento_variante()
RETURNS TRIGGER AS $$
DECLARE
    variante_id UUID;
    item_record RECORD;
BEGIN
    -- Se o pedido foi cancelado, reverter o estoque dos itens
    IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
        
        -- Para cada item do pedido
        FOR item_record IN 
            SELECT * FROM public.itens_pedido 
            WHERE pedido_id = NEW.id
        LOOP
            
            -- Encontrar a variação que foi usada na venda
            SELECT id INTO variante_id
            FROM public.variantes_produto 
            WHERE produto_id = item_record.produto_id::UUID
            AND ativo = true
            ORDER BY created_at
            LIMIT 1;
            
            -- Se não encontrar, criar uma padrão
            IF variante_id IS NULL THEN
                INSERT INTO public.variantes_produto (
                    produto_id, cor, tamanho, estoque, ativo, sku
                ) VALUES (
                    item_record.produto_id::UUID,
                    'Padrão',
                    'Único',
                    0,
                    true,
                    'DEFAULT-' || item_record.produto_id
                ) RETURNING id INTO variante_id;
            END IF;
            
            -- Reverter o estoque
            UPDATE public.variantes_produto 
            SET estoque = COALESCE(estoque, 0) + item_record.quantidade,
                updated_at = NOW()
            WHERE id = variante_id;
            
            -- Registrar movimentação de ajuste
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
                'ajuste',
                item_record.quantidade,
                item_record.preco_unitario,
                item_record.subtotal,
                'Cancelamento de pedido',
                'Cancelamento - Pedido: ' || NEW.numero_pedido,
                'Sistema - Cancelamento Automático'
            );
            
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Atualizar trigger de cancelamento
DROP TRIGGER IF EXISTS trigger_reverter_estoque_cancelamento ON public.pedidos;
DROP TRIGGER IF EXISTS trigger_reverter_estoque_cancelamento_variante ON public.pedidos;

CREATE TRIGGER trigger_reverter_estoque_cancelamento_variante
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION reverter_estoque_cancelamento_variante();

-- 9. Atualizar a função get_business_summary para usar variações
CREATE OR REPLACE FUNCTION get_business_summary()
RETURNS TABLE (
    produtos_ativos BIGINT,
    taxa_entrega_percentual NUMERIC(5,2),
    regiao_principal TEXT,
    produtos_estoque_baixo BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Produtos ativos
        (SELECT COUNT(*) FROM produtos WHERE ativo = true) as produtos_ativos,
        
        -- Taxa de entrega (exemplo)
        COALESCE((
            SELECT ROUND((COUNT(*) FILTER (WHERE tipo_entrega = 'delivery') * 100.0 / 
                   GREATEST(COUNT(*), 1)), 2)
            FROM pedidos 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ), 0) as taxa_entrega_percentual,
        
        -- Região principal (exemplo)
        COALESCE((
            SELECT bairro 
            FROM (
                SELECT bairro, COUNT(*) as count
                FROM pedidos 
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                AND bairro IS NOT NULL
                GROUP BY bairro
                ORDER BY count DESC
                LIMIT 1
            ) sub
        ), 'N/A') as regiao_principal,
        
        -- Produtos com estoque baixo (agora usando soma de variações)
        (SELECT COUNT(DISTINCT p.id)
         FROM produtos p
         WHERE p.ativo = true
         AND obter_estoque_total_produto(p.id) <= 5
         AND obter_estoque_total_produto(p.id) >= 0) as produtos_estoque_baixo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Conceder permissões para as novas funções
GRANT EXECUTE ON FUNCTION obter_estoque_total_produto(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_estoque_suficiente(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_summary() TO anon;

COMMIT;

-- =====================================================
-- VALIDAÇÃO DAS ATUALIZAÇÕES
-- =====================================================

-- Testar as novas funções
DO $$
BEGIN
    -- Verificar se as funções foram criadas
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'obter_estoque_total_produto'
    ) THEN
        RAISE EXCEPTION 'Falha: função obter_estoque_total_produto não foi criada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'verificar_estoque_suficiente'
    ) THEN
        RAISE EXCEPTION 'Falha: função verificar_estoque_suficiente não foi criada';
    END IF;
    
    RAISE NOTICE 'Todas as funções de estoque foram atualizadas com sucesso para trabalhar com variações!';
END $$;

-- =====================================================
-- INSTRUÇÕES PÓS-ATUALIZAÇÃO
-- =====================================================

-- 1. Testar a função de estoque total:
-- SELECT obter_estoque_total_produto((SELECT id FROM produtos LIMIT 1));

-- 2. Testar verificação de estoque:
-- SELECT verificar_estoque_suficiente((SELECT id FROM produtos LIMIT 1), 10);

-- 3. Testar o resumo de negócios:
-- SELECT * FROM get_business_summary();

-- 4. Monitorar o sistema após vendas para garantir que
--    o estoque está sendo atualizado corretamente nas variações