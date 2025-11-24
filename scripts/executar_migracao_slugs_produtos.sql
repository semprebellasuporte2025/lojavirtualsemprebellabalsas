-- Script completo para executar migração de slugs para produtos
-- Execute este script no SQL Editor do Supabase Studio

-- 1. Verificar se a coluna slug já existe na tabela produtos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'produtos' 
    AND column_name = 'slug'
  ) THEN
    -- 2. Adicionar campo slug à tabela produtos (só se não existir)
    ALTER TABLE produtos ADD COLUMN slug TEXT;
    RAISE NOTICE 'Coluna slug adicionada à tabela produtos';
  ELSE
    RAISE NOTICE 'Coluna slug já existe na tabela produtos';
  END IF;
END $$;

-- 3. Criar índice único para slugs (se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS produtos_slug_unique ON produtos(slug);

-- 4. Criar função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION generate_product_slug(nome TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        UNACCENT(nome),
        '[^a-z0-9\s]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Gerar slugs para produtos existentes onde slug estiver nulo ou inválido
-- Inválido: qualquer coisa que não siga o padrão [a-z0-9]+(?:-[a-z0-9]+)*
WITH invalids AS (
  SELECT id, nome FROM produtos 
  WHERE slug IS NULL OR slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
)
UPDATE produtos p
SET slug = generate_product_slug(i.nome)
FROM invalids i
WHERE p.id = i.id;

-- 6. Resolver colisões de slugs automaticamente, adicionando sufixos incrementais
-- Observação: este bloco é simplificado; para muitos conflitos, execute múltiplas vezes
WITH dups AS (
  SELECT slug, array_agg(id) AS ids
  FROM produtos
  WHERE slug IS NOT NULL
  GROUP BY slug
  HAVING COUNT(*) > 1
),
to_fix AS (
  SELECT (ids)[2] AS id_conflict, slug FROM dups
)
UPDATE produtos p
SET slug = p.slug || '-2'
FROM to_fix f
WHERE p.id = f.id_conflict;

-- 7. Criar trigger para atualizar automaticamente o slug quando o nome for alterado
CREATE OR REPLACE FUNCTION update_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    NEW.slug := generate_product_slug(NEW.nome);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS produtos_slug_trigger ON produtos;
CREATE TRIGGER produtos_slug_trigger
  BEFORE INSERT OR UPDATE OF nome ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_product_slug();

-- 8. Verificar resultados
SELECT id, nome, slug 
FROM produtos 
ORDER BY created_at DESC
LIMIT 50;

-- 9. Verificar se há slugs duplicados (deve retornar 0 linhas após resolver)
SELECT slug, COUNT(*) 
FROM produtos 
WHERE slug IS NOT NULL 
GROUP BY slug 
HAVING COUNT(*) > 1;