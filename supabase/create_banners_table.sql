-- Criar tabela de banners para slides da home page
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(500),
    imagem_url TEXT NOT NULL,
    link_destino TEXT,
    ordem_exibicao INTEGER NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_banners_ativo ON public.banners(ativo);
CREATE INDEX IF NOT EXISTS idx_banners_ordem ON public.banners(ordem_exibicao);
CREATE INDEX IF NOT EXISTS idx_banners_ativo_ordem ON public.banners(ativo, ordem_exibicao);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON public.banners 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para recriar)
DROP POLICY IF EXISTS "Banners são visíveis publicamente" ON public.banners;
DROP POLICY IF EXISTS "Administradores podem gerenciar banners" ON public.banners;

-- Política para leitura pública (qualquer usuário pode ver banners ativos)
CREATE POLICY "Banners são visíveis publicamente" ON public.banners
    FOR SELECT USING (ativo = true);

-- Política para administradores (CRUD completo)
CREATE POLICY "Administradores podem gerenciar banners" ON public.banners
    FOR ALL USING (auth.role() = 'authenticated' AND 
                 EXISTS (SELECT 1 FROM public.usuarios_admin WHERE id = auth.uid() AND ativo = true));

-- Conceder permissões
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT ALL ON public.banners TO service_role;

-- Inserir alguns banners de exemplo
INSERT INTO public.banners (titulo, subtitulo, imagem_url, link_destino, ordem_exibicao, ativo) VALUES
('Promoção de Verão', 'Até 50% de desconto em produtos selecionados', 'https://via.placeholder.com/1920x600/ff6b6b/ffffff?text=Promoção+de+Verão', '/categoria/promocoes', 1, true),
('Novos Produtos', 'Confira as últimas novidades da nossa loja', 'https://via.placeholder.com/1920x600/4ecdc4/ffffff?text=Novos+Produtos', '/categoria/novidades', 2, true),
('Frete Grátis', 'Frete grátis para compras acima de R$ 100', 'https://via.placeholder.com/1920x600/45b7d1/ffffff?text=Frete+Grátis', '/frete-entrega', 3, true);

-- Comentários na tabela e colunas
COMMENT ON TABLE public.banners IS 'Tabela para armazenar banners/slides da página inicial';
COMMENT ON COLUMN public.banners.id IS 'Identificador único do banner';
COMMENT ON COLUMN public.banners.titulo IS 'Título principal do banner';
COMMENT ON COLUMN public.banners.subtitulo IS 'Subtítulo ou descrição do banner';
COMMENT ON COLUMN public.banners.imagem_url IS 'URL da imagem do banner (recomendado: 1920x600px)';
COMMENT ON COLUMN public.banners.link_destino IS 'URL de destino quando o banner for clicado';
COMMENT ON COLUMN public.banners.ordem_exibicao IS 'Ordem de exibição do banner (menor número = primeira posição)';
COMMENT ON COLUMN public.banners.ativo IS 'Define se o banner está ativo e visível';
COMMENT ON COLUMN public.banners.created_at IS 'Data e hora de criação do banner';
COMMENT ON COLUMN public.banners.updated_at IS 'Data e hora da última atualização do banner';