-- Gerar slugs para categorias existentes
UPDATE categorias 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(nome),
      '[^a-z0-9\\s]', '', 'g'
    ),
    '\\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Verificar se todos os slugs foram gerados corretamente
SELECT id, nome, slug 
FROM categorias 
WHERE slug IS NULL;