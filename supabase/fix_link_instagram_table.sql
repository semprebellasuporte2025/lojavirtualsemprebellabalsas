-- Script para corrigir a tabela link_instagram adicionando campos faltantes
-- Este script deve ser executado no Editor SQL do Supabase

-- Adicionar campos para imagem topo (necessários para o cadastro de imagem topo)
ALTER TABLE public.link_instagram 
ADD COLUMN IF NOT EXISTS img_topo TEXT,
ADD COLUMN IF NOT EXISTS linktopo_img_ TEXT,
ADD COLUMN IF NOT EXISTS descricao_topo TEXT;

-- Adicionar campos para links normais (caso não existam)
ALTER TABLE public.link_instagram 
ADD COLUMN IF NOT EXISTS nome_link TEXT,
ADD COLUMN IF NOT EXISTS img_link TEXT,
ADD COLUMN IF NOT EXISTS link_img TEXT,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índices para melhor performance (caso não existam)
CREATE INDEX IF NOT EXISTS idx_link_instagram_ativo ON public.link_instagram(ativo);
CREATE INDEX IF NOT EXISTS idx_link_instagram_created_at ON public.link_instagram(created_at DESC);

-- Atualizar trigger para updated_at (caso não exista)
CREATE OR REPLACE FUNCTION update_link_instagram_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_link_instagram_updated_at'
    ) THEN
        CREATE TRIGGER update_link_instagram_updated_at 
            BEFORE UPDATE ON public.link_instagram
            FOR EACH ROW
            EXECUTE FUNCTION update_link_instagram_updated_at();
    END IF;
END$$;

-- Verificar estrutura atual da tabela após as alterações
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'link_instagram' 
AND table_schema = 'public'
ORDER BY ordinal_position;