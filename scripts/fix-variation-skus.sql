-- Script para corrigir os SKUs das variações de produtos
-- Este script remove os sufixos de tamanho e cor dos SKUs, mantendo apenas a referência base

-- Primeiro, vamos verificar os SKUs atuais para entender o padrão
SELECT 
    id,
    produto_id,
    cor,
    tamanho,
    sku,
    -- Extrai apenas a parte da referência base (antes do primeiro hífen)
    CASE 
        WHEN sku IS NOT NULL AND sku != '' AND position('-' in sku) > 0 
        THEN substring(sku from '^[^-]+')
        ELSE sku
    END as nova_referencia
FROM public.variantes_produto 
WHERE sku IS NOT NULL AND sku != ''
ORDER BY created_at DESC
LIMIT 20;

-- Agora vamos atualizar os SKUs para manter apenas a referência base
-- ATENÇÃO: Este é um UPDATE que modifica dados. Faça backup antes de executar em produção!

UPDATE public.variantes_produto 
SET sku = CASE 
    WHEN sku IS NOT NULL AND sku != '' AND position('-' in sku) > 0 
    THEN substring(sku from '^[^-]+')
    ELSE sku
END
WHERE sku IS NOT NULL AND sku != '';

-- Verifique o resultado da atualização
SELECT 
    COUNT(*) as total_variacoes_atualizadas
FROM public.variantes_produto 
WHERE sku IS NOT NULL AND sku != '' 
AND position('-' in sku) > 0;

-- Mostre alguns exemplos após a atualização
SELECT 
    id,
    produto_id,
    cor,
    tamanho,
    sku as referencia_atualizada
FROM public.variantes_produto 
WHERE sku IS NOT NULL AND sku != ''
ORDER BY updated_at DESC
LIMIT 10;