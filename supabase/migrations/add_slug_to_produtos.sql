-- Migração para adicionar campo slug na tabela produtos
-- Este script adiciona o campo slug e cria um índice único para garantir slugs únicos

-- Adicionar coluna slug
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para slugs (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS produtos_slug_unique 
ON public.produtos (LOWER(slug)) 
WHERE slug IS NOT NULL;

-- Criar função para gerar slugs a partir do nome
CREATE OR REPLACE FUNCTION public.generate_slug(nome TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    slug TEXT;
BEGIN
    -- Converter para minúsculas, remover acentos, substituir espaços por hífens
    -- e remover caracteres especiais
    slug := LOWER(UNACCENT(nome));
    slug := REGEXP_REPLACE(slug, '[^a-z0-9\-]+', '-', 'g');
    slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
    slug := TRIM(BOTH '-' FROM slug);
    
    RETURN slug;
END;
$$;

-- Adicionar função unaccent se não existir
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Atualizar slugs existentes com base nos nomes dos produtos
UPDATE public.produtos 
SET slug = public.generate_slug(nome) 
WHERE slug IS NULL;

-- Criar trigger para atualizar automaticamente o slug quando o nome for alterado
CREATE OR REPLACE FUNCTION public.update_produto_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.nome IS DISTINCT FROM OLD.nome THEN
        NEW.slug := public.generate_slug(NEW.nome);
    END IF;
    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_update_produto_slug ON public.produtos;
CREATE TRIGGER trg_update_produto_slug
BEFORE UPDATE OF nome ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_produto_slug();