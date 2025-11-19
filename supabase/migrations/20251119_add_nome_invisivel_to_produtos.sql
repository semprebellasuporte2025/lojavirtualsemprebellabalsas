-- Adiciona coluna para controlar visibilidade do nome do produto
-- Campo booleano com default falso para não afetar dados existentes

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS nome_invisivel BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice opcional para facilitar filtros por nome oculto
CREATE INDEX IF NOT EXISTS idx_produtos_nome_invisivel ON public.produtos (nome_invisivel);