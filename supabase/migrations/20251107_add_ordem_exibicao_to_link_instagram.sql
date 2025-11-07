-- Adiciona coluna de ordenação à tabela link_instagram e cria índice
-- Execute este script no Editor SQL do Supabase, caso seu ambiente ainda não tenha a coluna

ALTER TABLE public.link_instagram
    ADD COLUMN IF NOT EXISTS ordem_exibicao INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_link_instagram_ordem
    ON public.link_instagram (ordem_exibicao);

-- Opcional: inicializa uma ordenação sequencial baseada na data de criação
-- Atualiza apenas registros com ordem_exibicao = 1 (valor padrão)
WITH ordered AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
    FROM public.link_instagram
    WHERE COALESCE(img_topo, '') = ''
)
UPDATE public.link_instagram t
SET ordem_exibicao = o.rn
FROM ordered o
WHERE t.id = o.id
  AND t.ordem_exibicao = 1;

COMMENT ON COLUMN public.link_instagram.ordem_exibicao IS 'Define a ordem de exibição dos links (menor aparece primeiro)';