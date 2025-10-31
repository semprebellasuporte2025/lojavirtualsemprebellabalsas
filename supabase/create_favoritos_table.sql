-- Criar tabela favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  produto_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evitar duplicidade do mesmo produto para o mesmo cliente
ALTER TABLE public.favoritos
  ADD CONSTRAINT favoritos_unique_cliente_produto UNIQUE (cliente_id, produto_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente_id ON public.favoritos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_produto_id ON public.favoritos(produto_id);

-- Habilitar RLS
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (usuários autenticados só acessam seus próprios favoritos)
CREATE POLICY "favoritos_select_own" ON public.favoritos
  FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "favoritos_insert_own" ON public.favoritos
  FOR INSERT WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "favoritos_delete_own" ON public.favoritos
  FOR DELETE USING (auth.uid() = cliente_id);

-- Comentários
COMMENT ON TABLE public.favoritos IS 'Tabela de produtos favoritos por cliente';
COMMENT ON COLUMN public.favoritos.cliente_id IS 'ID do usuário autenticado (auth.uid())';
COMMENT ON COLUMN public.favoritos.produto_id IS 'ID do produto favoritado';