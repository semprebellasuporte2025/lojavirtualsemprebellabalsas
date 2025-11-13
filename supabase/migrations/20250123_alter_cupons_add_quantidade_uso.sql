-- Adiciona campo de quantidade de uso à tabela simples de cupons

ALTER TABLE IF EXISTS public.cupons
  ADD COLUMN IF NOT EXISTS quantidade_uso integer NOT NULL DEFAULT 0
  CHECK (quantidade_uso >= 0);

COMMENT ON COLUMN public.cupons.quantidade_uso IS 'Total de usos realizados pelo cupom';