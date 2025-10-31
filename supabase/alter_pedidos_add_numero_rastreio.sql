-- Adicionar campo numero_rastreio à tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS numero_rastreio TEXT;

-- Comentário para documentação
COMMENT ON COLUMN public.pedidos.numero_rastreio IS 'Número de rastreamento da entrega do pedido';