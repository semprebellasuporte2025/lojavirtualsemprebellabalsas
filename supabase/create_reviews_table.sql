-- Criar tabela reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_authenticated" ON public.reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = cliente_id);

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = cliente_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_produto_id ON public.reviews(produto_id);
CREATE INDEX IF NOT EXISTS idx_reviews_cliente_id ON public.reviews(cliente_id);

-- Comentários
COMMENT ON TABLE public.reviews IS 'Tabela de avaliações de produtos';
COMMENT ON COLUMN public.reviews.produto_id IS 'ID do produto avaliado';
COMMENT ON COLUMN public.reviews.cliente_id IS 'ID do cliente que fez a avaliação';
COMMENT ON COLUMN public.reviews.rating IS 'Nota da avaliação (1-5)';
COMMENT ON COLUMN public.reviews.comentario IS 'Comentário da avaliação';