-- Script opcional: resolve duplicidades exatas de (slug, referencia)
-- Adiciona sufixos incrementais ao slug dos registros conflitantes, preservando o primeiro
-- Execute manualmente no Supabase Studio se a criação do índice único composto falhar por duplicidades

WITH dups AS (
  SELECT LOWER(slug) AS lslug, LOWER(referencia) AS lref, array_agg(id ORDER BY created_at ASC) AS ids
  FROM public.produtos
  WHERE slug IS NOT NULL AND referencia IS NOT NULL
  GROUP BY LOWER(slug), LOWER(referencia)
  HAVING COUNT(*) > 1
),
fix AS (
  SELECT d.lslug, d.lref, unnest(d.ids[2:]) AS id_conflict, generate_series(2, array_length(d.ids, 1)) AS suffix
  FROM dups d
)
UPDATE public.produtos p
SET slug = CONCAT(p.slug, '-', fix.suffix)
FROM fix
WHERE p.id = fix.id_conflict;

-- Verificação: deve retornar 0 linhas
SELECT LOWER(slug) AS lslug, LOWER(referencia) AS lref, COUNT(*)
FROM public.produtos
WHERE slug IS NOT NULL AND referencia IS NOT NULL
GROUP BY LOWER(slug), LOWER(referencia)
HAVING COUNT(*) > 1;

