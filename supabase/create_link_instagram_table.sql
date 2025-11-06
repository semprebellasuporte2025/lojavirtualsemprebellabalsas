-- Criar tabela link_instagram para armazenar links do Instagram
CREATE TABLE IF NOT EXISTS public.link_instagram (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_link TEXT NOT NULL,
    img_link TEXT,
    link_img TEXT,
    img_topo TEXT,
    linktopo_img_ TEXT,
    descricao_topo TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem_exibicao INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
) TABLESPACE pg_default;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_link_instagram_ativo ON public.link_instagram USING btree (ativo) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_link_instagram_ordem ON public.link_instagram USING btree (ordem_exibicao) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_link_instagram_created_at ON public.link_instagram USING btree (created_at DESC) TABLESPACE pg_default;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.link_instagram ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Permitir acesso público aos links ativos" ON public.link_instagram
    FOR SELECT USING (ativo = true);

CREATE POLICY "Permitir administradores gerenciarem links" ON public.link_instagram
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_link_instagram_updated_at 
    BEFORE UPDATE ON public.link_instagram
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.link_instagram IS 'Tabela que armazena links e imagens para página do Instagram';
COMMENT ON COLUMN public.link_instagram.nome_link IS 'Nome do link do Instagram';
COMMENT ON COLUMN public.link_instagram.img_link IS 'URL da imagem do link';
COMMENT ON COLUMN public.link_instagram.link_img IS 'URL alternativa da imagem do link';
COMMENT ON COLUMN public.link_instagram.img_topo IS 'URL da imagem do topo da página';
COMMENT ON COLUMN public.link_instagram.linktopo_img_ IS 'URL de destino quando a imagem topo é clicada';
COMMENT ON COLUMN public.link_instagram.descricao_topo IS 'Descrição/bio da imagem topo';
COMMENT ON COLUMN public.link_instagram.ativo IS 'Indica se o link está ativo';
COMMENT ON COLUMN public.link_instagram.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.link_instagram.updated_at IS 'Data da última atualização do registro';