-- Corrige slugs de produtos já cadastrados, normalizando acentos, "ç",
-- espaços e removendo caracteres especiais. NÃO altera índices.
-- Executar em produção com cuidado.

-- 1) Habilitar extensão opcional para remoção de acentos (se disponível)
-- Obs.: Se sua instância já possui a extensão, este comando só garante a existência.
-- CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) Atualizar slugs com abordagem robusta
-- Usa UNACCENT quando disponível; caso não, utiliza fallback com TRANSLATE
-- e REGEXP_REPLACE para normalizar.

-- Versão com UNACCENT (recomendada):
-- UPDATE public.produtos p
-- SET slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(
--   REGEXP_REPLACE(LOWER(UNACCENT(COALESCE(p.nome, ''))), '[^a-z0-9]+', '-', 'g'),
--   '-+', '-', 'g'
-- ))
-- WHERE TRUE;

-- Versão fallback sem UNACCENT:
UPDATE public.produtos p
SET slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(
  REGEXP_REPLACE(
    LOWER(
      TRANSLATE(
        COALESCE(p.nome, ''),
        'áàãâäéèêëíìîïóòôõöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiiooooouuuucnaaaaeeeeiiiiooooouuuucn'
      )
    ),
    '[^a-z0-9]+', '-', 'g'
  ),
  '-+', '-', 'g'
))
WHERE TRUE;

-- 3) (Opcional) Verificar slugs inválidos ou em branco após a correção
-- SELECT COUNT(*) FROM public.produtos WHERE slug IS NULL OR slug = '';
-- SELECT slug FROM public.produtos WHERE slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' LIMIT 20;

-- 4) (Opcional) Resolver duplicidades adicionando sufixos incrementais
-- Se desejar garantir unicidade total por slug (sem depender da referência),
-- descomente o bloco abaixo.
-- WITH dups AS (
--   SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY LOWER(slug) ORDER BY id) AS rn
--   FROM public.produtos
--   WHERE slug IS NOT NULL AND slug <> ''
-- )
-- UPDATE public.produtos p
-- SET slug = CASE WHEN d.rn = 1 THEN p.slug ELSE CONCAT(p.slug, '-', d.rn) END
-- FROM dups d
-- WHERE p.id = d.id AND d.rn > 1;

-- 5) Validação final
-- SELECT slug, COUNT(*) AS qtd FROM public.produtos GROUP BY slug HAVING COUNT(*) > 1;

