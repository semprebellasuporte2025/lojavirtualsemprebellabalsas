-- Adiciona a coluna 'material' à tabela 'produtos'
ALTER TABLE public.produtos
ADD COLUMN material VARCHAR(255);

-- Adiciona a coluna 'material' à tabela 'itens_pedido'
ALTER TABLE public.itens_pedido
ADD COLUMN material VARCHAR(255);