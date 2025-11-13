-- Adicionar campo slug à tabela categorias
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para slugs
CREATE UNIQUE INDEX IF NOT EXISTS categorias_slug_unique ON categorias(slug);

-- Criar função para gerar slug a partir do nome
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

-- Atualizar slugs existentes
UPDATE categorias 
SET slug = generate_category_slug(nome)
WHERE slug IS NULL;

-- Criar trigger para atualizar automaticamente o slug quando o nome for alterado
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