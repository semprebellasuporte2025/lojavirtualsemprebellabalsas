-- Adiciona a coluna 'material' à tabela 'produtos'
-- Esta migração adiciona a coluna material como VARCHAR(255) que permite valores NULL

ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS material VARCHAR(255);

-- Comentário explicativo sobre a coluna
COMMENT ON COLUMN public.produtos.material IS 'Material principal do produto (ex: algodão, poliéster, etc.)';

-- Exemplo de atualização de dados existentes (opcional)
-- UPDATE public.produtos SET material = 'Não especificado' WHERE material IS NULL;