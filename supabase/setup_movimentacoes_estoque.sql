-- =====================================================
-- SCRIPT DE CRIAÇÃO DA TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar a tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  fornecedor_nome TEXT, -- Nome do fornecedor (texto livre)
  numero_nota TEXT,
  motivo TEXT, -- Para saídas e ajustes
  observacoes TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON public.movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON public.movimentacoes_estoque(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_created_at ON public.movimentacoes_estoque(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_id ON public.movimentacoes_estoque(usuario_id);

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_movimentacoes_estoque_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_movimentacoes_estoque_updated_at ON public.movimentacoes_estoque;
CREATE TRIGGER update_movimentacoes_estoque_updated_at
  BEFORE UPDATE ON public.movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION update_movimentacoes_estoque_updated_at();

-- 5. Função para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION atualizar_estoque_produto()
RETURNS TRIGGER AS $$
BEGIN
  -- Para entrada: somar ao estoque
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.produtos 
    SET estoque = COALESCE(estoque, 0) + NEW.quantidade,
        updated_at = NOW()
    WHERE id = NEW.produto_id;
  
  -- Para saída: subtrair do estoque
  ELSIF NEW.tipo = 'saida' THEN
    UPDATE public.produtos 
    SET estoque = COALESCE(estoque, 0) - NEW.quantidade,
        updated_at = NOW()
    WHERE id = NEW.produto_id;
  
  -- Para ajuste: aplicar a quantidade (pode ser positiva ou negativa)
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE public.produtos 
    SET estoque = COALESCE(estoque, 0) + NEW.quantidade,
        updated_at = NOW()
    WHERE id = NEW.produto_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar estoque automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_estoque_produto ON public.movimentacoes_estoque;
CREATE TRIGGER trigger_atualizar_estoque_produto
  AFTER INSERT ON public.movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_produto();

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- 8. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir leitura de movimentações para usuários autenticados" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "Permitir inserção de movimentações para usuários autenticados" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "Permitir atualização de movimentações para usuários autenticados" ON public.movimentacoes_estoque;

-- 9. Criar políticas de segurança
CREATE POLICY "Permitir leitura de movimentações para usuários autenticados"
  ON public.movimentacoes_estoque FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de movimentações para usuários autenticados"
  ON public.movimentacoes_estoque FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de movimentações para usuários autenticados"
  ON public.movimentacoes_estoque FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 10. Verificar se a coluna 'estoque' existe na tabela produtos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produtos' 
    AND column_name = 'estoque'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN estoque INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_produtos_estoque ON public.produtos(estoque);
  END IF;
END $$;

-- 11. Inserir dados de exemplo (opcional - remova se não quiser dados de teste)
INSERT INTO public.movimentacoes_estoque (
  produto_id,
  tipo,
  quantidade,
  valor_unitario,
  valor_total,
  fornecedor_nome,
  numero_nota,
  usuario_nome,
  observacoes
) 
SELECT 
  p.id,
  'entrada',
  100,
  p.preco * 0.7, -- Simula preço de custo (70% do preço de venda)
  (p.preco * 0.7) * 100,
  'Fornecedor Exemplo Ltda',
  'NF-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
  'Sistema - Importação Inicial',
  'Estoque inicial importado automaticamente'
FROM public.produtos p
WHERE p.id IS NOT NULL
LIMIT 5; -- Limita a 5 produtos para não sobrecarregar

-- =====================================================
-- SCRIPT EXECUTADO COM SUCESSO!
-- 
-- Próximos passos:
-- 1. Verifique se a tabela foi criada: SELECT * FROM movimentacoes_estoque;
-- 2. Teste a aplicação nas páginas de estoque
-- 3. Monitore os logs para verificar se tudo está funcionando
-- =====================================================