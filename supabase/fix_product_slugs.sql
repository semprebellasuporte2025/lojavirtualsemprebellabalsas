-- Corrigir e atualizar todas as slugs de produtos
-- 1) Reforça a função de geração de slug
-- 2) Recalcula slugs a partir do nome
-- 3) Resolve duplicidades com sufixos incrementais

-- Garante extensão para remover acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Recria/garante função de slug consistente
CREATE OR REPLACE FUNCTION public.generate_slug(nome TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    s TEXT;
BEGIN
    IF nome IS NULL OR nome = '' THEN
      RETURN '';
    END IF;
    -- Remove espaços em excesso antes de gerar a slug
    nome := TRIM(nome);
    s := LOWER(UNACCENT(nome));
    -- Substitui qualquer caractere não alfanumérico por '-'
    s := REGEXP_REPLACE(s, '[^a-z0-9]+', '-', 'g');
    -- Colapsa múltiplos hífens
    s := REGEXP_REPLACE(s, '-+', '-', 'g');
    -- Remove hífens no início/fim
    s := TRIM(BOTH '-' FROM s);
    RETURN s;
END;
$$;

-- IMPORTANTE: desativa o índice único temporariamente para permitir o recálculo
DROP INDEX IF EXISTS produtos_slug_unique;

-- Recalcula slugs com base no nome
UPDATE public.produtos p
SET slug = public.generate_slug(p.nome)
WHERE TRUE;

-- Resolve duplicidades de slug atribuindo sufixos -2, -3, ...
WITH dups AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY LOWER(slug) ORDER BY id) AS rn
  FROM public.produtos
  WHERE slug IS NOT NULL AND slug <> ''
)
UPDATE public.produtos p
SET slug = CASE WHEN d.rn = 1 THEN p.slug ELSE CONCAT(p.slug, '-', d.rn) END
FROM dups d
WHERE p.id = d.id AND d.rn > 1;

-- Recria índice único (case insensitive) garantindo unicidade
CREATE UNIQUE INDEX IF NOT EXISTS produtos_slug_unique
ON public.produtos (LOWER(slug))
WHERE slug IS NOT NULL AND slug <> '';

-- Opcional: validação rápida do resultado
-- SELECT slug, COUNT(*) FROM public.produtos WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;