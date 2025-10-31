-- Criar tabela itens_pedido
CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tamanho TEXT,
    cor TEXT,
    imagem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON public.itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto_id ON public.itens_pedido(produto_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança (versão simplificada)
-- Permitir acesso completo por enquanto, ajustar depois conforme necessário
CREATE POLICY "Permitir acesso aos itens de pedido" ON public.itens_pedido
    FOR ALL USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_itens_pedido_updated_at 
    BEFORE UPDATE ON public.itens_pedido 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.itens_pedido IS 'Tabela que armazena os itens de cada pedido';
COMMENT ON COLUMN public.itens_pedido.pedido_id IS 'Referência ao pedido';
COMMENT ON COLUMN public.itens_pedido.produto_id IS 'ID do produto';
COMMENT ON COLUMN public.itens_pedido.nome IS 'Nome do produto no momento da compra';
COMMENT ON COLUMN public.itens_pedido.quantidade IS 'Quantidade do produto';
COMMENT ON COLUMN public.itens_pedido.preco_unitario IS 'Preço unitário do produto no momento da compra';
COMMENT ON COLUMN public.itens_pedido.subtotal IS 'Subtotal do item (quantidade * preco_unitario)';
COMMENT ON COLUMN public.itens_pedido.tamanho IS 'Tamanho selecionado do produto';
COMMENT ON COLUMN public.itens_pedido.cor IS 'Cor selecionada do produto';
COMMENT ON COLUMN public.itens_pedido.imagem IS 'URL da imagem do produto';