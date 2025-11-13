-- Script completo para executar migração de slugs para categorias
-- Execute este script no SQL Editor do Supabase Studio

-- 1. Primeiro verificar se a coluna slug já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categorias' 
    AND column_name = 'slug'
  ) THEN
    -- 2. Adicionar campo slug à tabela categorias (só se não existir)
    ALTER TABLE categorias ADD COLUMN slug TEXT;
    RAISE NOTICE 'Coluna slug adicionada à tabela categorias';
  ELSE
    RAISE NOTICE 'Coluna slug já existe na tabela categorias';
  END IF;
END $$;

-- 3. Criar índice único para slugs (se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS categorias_slug_unique ON categorias(slug);

-- 4. Criar função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION generate_category_slug(nome TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        UNACCENT(nome),
        '[^a-z0-9\\s]', '', 'g'
      ),
      '\\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Gerar slugs para categorias existentes
UPDATE categorias 
SET slug = generate_category_slug(nome)
WHERE slug IS NULL;

-- 6. Criar trigger para atualizar automaticamente o slug quando o nome for alterado
CREATE OR REPLACE FUNCTION update_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    NEW.slug := generate_category_slug(NEW.nome);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categorias_slug_trigger ON categorias;
CREATE TRIGGER categorias_slug_trigger
  BEFORE INSERT OR UPDATE OF nome ON categorias
  FOR EACH ROW
  EXECUTE FUNCTION update_category_slug();

-- 7. Verificar resultados
SELECT id, nome, slug 
FROM categorias 
ORDER BY nome;

-- 8. Verificar se há slugs duplicados (deve retornar 0 linhas)
SELECT slug, COUNT(*) 
FROM categorias 
WHERE slug IS NOT NULL 
GROUP BY slug 
HAVING COUNT(*) > 1;