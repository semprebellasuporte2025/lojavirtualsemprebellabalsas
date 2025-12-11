-- Atualiza validação de unicidade: agora rejeita apenas quando (slug AND referencia) repetem
-- Mantém compatibilidade com dados existentes (slug pode se repetir se referencia for diferente)

-- 1) Remover índices únicos antigos de slug isolado
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'produtos_slug_unique'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.produtos_slug_unique';
  END IF;
END $$;

-- 2) Criar índice único composto em (LOWER(slug), LOWER(referencia)) quando ambos não forem nulos
CREATE UNIQUE INDEX IF NOT EXISTS produtos_slug_ref_unique 
ON public.produtos (LOWER(slug), LOWER(referencia))
WHERE slug IS NOT NULL AND referencia IS NOT NULL;

-- 3) Função RPC para validação composta, ignorando RLS
-- Retorna TRUE se já existir produto com mesma combinação (slug, referencia) (case-insensitive)
CREATE OR REPLACE FUNCTION public.check_product_duplicate(p_slug TEXT, p_referencia TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_pair BOOLEAN := FALSE;
BEGIN
  -- Tratar nulos/vazios: só há duplicidade se ambos existirem
  IF COALESCE(TRIM(p_slug), '') = '' OR COALESCE(TRIM(p_referencia), '') = '' THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.produtos
    WHERE LOWER(produtos.slug) = LOWER(TRIM(p_slug))
      AND LOWER(produtos.referencia) = LOWER(TRIM(p_referencia))
  ) INTO exists_pair;

  RETURN exists_pair;
END;
$$;

-- Assegurar que função use schema público no runtime
ALTER FUNCTION public.check_product_duplicate(TEXT, TEXT) SET search_path = public;

-- 4) Permissões para execução via PostgREST (frontend)
GRANT EXECUTE ON FUNCTION public.check_product_duplicate(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_product_duplicate(TEXT, TEXT) TO authenticated;

-- 5) Comentários de documentação
COMMENT ON FUNCTION public.check_product_duplicate(TEXT, TEXT) IS 'Valida duplicidade composta (slug+referencia), case-insensitive, ignorando RLS.';

