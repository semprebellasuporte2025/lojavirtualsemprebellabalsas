-- Migração para gerar slugs para produtos existentes
-- Esta migração deve ser executada após a criação do campo slug

-- Primeiro, verifique se a função generate_slug existe
CREATE OR REPLACE FUNCTION public.generate_slug(nome_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    -- Converter para minúsculas, remover acentos, substituir espaços por hífens
    -- e remover caracteres especiais
    RETURN lower(
        regexp_replace(
            regexp_replace(
                unaccent(nome_text),
                '[^a-zA-Z0-9\\s]', '', 'g'
            ),
            '\\s+', '-', 'g'
        )
    );
END;
$$;

-- Atualizar slugs para todos os produtos existentes
UPDATE public.produtos 
SET slug = generate_slug(nome)
WHERE slug IS NULL OR slug = '';

-- Adicionar índice único para slugs (se ainda não existir)
CREATE UNIQUE INDEX IF NOT EXISTS produtos_slug_unique ON public.produtos(slug);

-- Comentário para documentação
COMMENT ON COLUMN public.produtos.slug IS 'Slug amigável para URLs, gerado automaticamente a partir do nome do produto';