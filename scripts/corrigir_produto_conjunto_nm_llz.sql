-- Correção pontual: garantir existência do produto "Conjunto Saia Blusa Nm Llz"
-- e categoria "Conjuntos".
-- Execute em uma única transação.

BEGIN;

-- 1) Garantir que a extensão unaccent exista (necessária para generate_slug)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) Criar/ajustar função generate_slug com parâmetro posicional (evita conflito de nomes)
DROP FUNCTION IF EXISTS public.generate_slug(text);
CREATE FUNCTION public.generate_slug(text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  s text := $1;
BEGIN
  IF s IS NULL OR s = '' THEN
    RETURN '';
  END IF;
  s := lower(regexp_replace(unaccent(s), '[^a-z0-9]+', '-', 'g'));
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  s := regexp_replace(s, '-{2,}', '-', 'g');
  RETURN s;
END;
$$;

-- 3) Garantir categoria "Conjuntos"
WITH existing AS (
  SELECT id FROM public.categorias WHERE nome = 'Conjuntos' LIMIT 1
), inserted AS (
  INSERT INTO public.categorias (nome, slug, ativa)
  SELECT 'Conjuntos', generate_slug('Conjuntos'), true
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
)
SELECT 1;

-- 4) Obter id da categoria "Conjuntos"
DO $$
DECLARE
  v_cat_id uuid;
  v_nome text := 'Conjunto Saia Blusa Nm Llz';
  v_slug text := public.generate_slug('Conjunto Saia Blusa Nm Llz');
  v_exists uuid;
  v_slug_exists uuid;
  v_final_slug text;
BEGIN
  SELECT id INTO v_cat_id FROM public.categorias WHERE nome = 'Conjuntos' LIMIT 1;

  -- já existe por nome?
  SELECT id INTO v_exists FROM public.produtos WHERE lower(nome) = lower(v_nome) LIMIT 1;
  -- já existe por slug?
  SELECT id INTO v_slug_exists FROM public.produtos WHERE slug = v_slug LIMIT 1;

  IF v_exists IS NOT NULL THEN
    -- se existe por nome, garantir slug e ativo
    v_final_slug := v_slug;
    -- resolver colisão simples
    IF EXISTS (SELECT 1 FROM public.produtos WHERE slug = v_final_slug AND id <> v_exists) THEN
      v_final_slug := v_final_slug || '-2';
    END IF;
    UPDATE public.produtos SET slug = v_final_slug, ativo = true WHERE id = v_exists;
  ELSIF v_slug_exists IS NOT NULL THEN
    -- se existe por slug, marcar ativo
    UPDATE public.produtos SET ativo = true WHERE id = v_slug_exists;
  ELSE
    -- inserir produto mínimo
    v_final_slug := v_slug;
    IF EXISTS (SELECT 1 FROM public.produtos WHERE slug = v_final_slug) THEN
      v_final_slug := v_final_slug || '-2';
    END IF;
    INSERT INTO public.produtos (nome, descricao, preco, categoria_id, estoque, ativo, slug)
    VALUES (
      v_nome,
      'Produto inserido automaticamente para corrigir link do frontend.',
      0,
      v_cat_id,
      0,
      true,
      v_final_slug
    );
  END IF;
END$$;

-- 5) Validação rápida
SELECT id, nome, slug, ativo
FROM public.produtos
WHERE lower(nome) = lower('Conjunto Saia Blusa Nm Llz') OR slug = public.generate_slug('Conjunto Saia Blusa Nm Llz') OR slug = public.generate_slug('Conjunto Saia Blusa Nm Llz') || '-2'
ORDER BY created_at DESC
LIMIT 3;

COMMIT;

